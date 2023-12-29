import chokidar from 'chokidar'
import fs from 'fs-extra'
import mime from 'mime-types'
import { dirname, extname, resolve } from 'path'
import { EMPTY, firstValueFrom, forkJoin, from, Observable, of } from 'rxjs'
import {
  bufferCount,
  bufferWhen,
  debounceTime,
  filter,
  map,
  mergeMap,
  reduce,
  share,
  tap
} from 'rxjs/operators'

import { albumsModel, settingsModel, tracksModel } from '../../models/index.js'
import * as playlists from '../../services/playlists.js'
// do not import ../../services to avoid circular dep
import * as tracks from '../../services/tracks.js'
import { broadcast, getArtworkFile, hash, walk } from '../../utils/index.js'
import AbstractProvider from '../abstract-provider.js'
import { findForAlbum, findInFolder } from './cover-finder.js'
import * as playlistUtils from './playlist.js'
import * as tagReader from './tag-reader.js'

const readConcurrency = 10
const walkConcurrency = 2
const saveThreshold = 50
const subscriptions = new Map()

/**
 * Makes a filtering function to exclude all incoming objects which are not supported files.
 * Supported must be files and which extension must
 * - be a track or a playlist (tracksOnly is false)
 * - be a track (tracksOnly is true)
 * - be a track or a brand new playlist (tracksOnly is true and the file is a brand new playlist)
 *
 * @param {boolean} [tracksOnly = false] - whether considering track files or track & playlist files
 * @returns {function} a filtering function for `filter()` reactive operator
 */
function onlySupported(tracksOnly = false) {
  const extensions = tracksOnly
    ? tagReader.formats
    : [...tagReader.formats, ...playlistUtils.formats]
  return function ({ path, stats, isNew }) {
    const ext = extname(path).toLowerCase()
    return (
      (!stats || stats.isFile()) &&
      (extensions.includes(ext) ||
        (isNew && playlistUtils.formats.includes(ext)))
    )
  }
}

/**
 * Generates a function that will save `cover` picture found in track's `tags` as an album `media`.
 * If the track already has a `media` property, it does nothing but deleting `tags.cover`.
 * The resulting file name will be `cover.{ext}`, the extension depends on the picture's MIME type.
 * It'll be store in the same folder as the track itself.
 * @param {object} logger - logger instance
 * @returns {function} asynchronous function that takes a track object as parameter, and returns
 * that same track object without any `cover` property in its `tags`
 */
function makeCoverExtractor(logger) {
  return async track => {
    const trackNoCover = {
      ...track,
      tags: { ...track.tags, cover: undefined }
    }
    if (track.media || !track.tags.cover) {
      return trackNoCover
    }
    // save cover from tags as album cover unless we already have media
    const { format, data } = track.tags.cover
    try {
      const media = resolve(
        dirname(track.path),
        `cover.${mime.extension(format)}`
      )
      await fs.writeFile(media, data)
      trackNoCover.media = media
    } catch (err) {
      logger.error(
        { track, err },
        `failed to save cover from track's tags as album cover: ${err.message}`
      )
    }
    return trackNoCover
  }
}

/**
 * Creates a pipeline for observable that will:
 * - read music tags from track files and build a TrackModel
 * - read playlist file content and build a PlaylistModel
 * - buffer models until threshold
 * - save models into their respective service
 * - accumulate all saved models into an array (only if observable is finite)
 *
 * The pipeline expect incoming objects with:
 * - {string} path - the absolute path of a file
 * - {object} stats - FS stats for this file (only modification timestamp is used)
 *
 * @param {object} logger             - logger instance
 * @param {number} [bufferSize = 50]  - number of models buffered before save
 * @param {boolean} [isFinite = true] - whether the observable will complete or not
 * @returns {array<function>} an array of reactive operators
 */
function makeEnrichAndSavePipeline(
  logger,
  bufferSize = saveThreshold,
  isFinite = true
) {
  const pipeline = [
    mergeMap(
      ({ path, id, stats: { mtimeMs, ino } }) =>
        playlistUtils.isPlaylistFile(path)
          ? from(playlistUtils.read(path)).pipe(
              filter(model => model),
              mergeMap(model => playlists.save(model, true))
            )
          : forkJoin({
              id: of(id || hash(path)),
              path: of(path),
              tags: from(tagReader.read(path)),
              media: from(findInFolder(path)),
              mtimeMs: of(mtimeMs),
              ino: of(ino)
            }).pipe(mergeMap(makeCoverExtractor(logger))),
      readConcurrency
    ),
    bufferCount(bufferSize),
    mergeMap(saved => {
      const savedTracks = saved.filter(model => model.path)
      return savedTracks.length
        ? from(tracks.add(savedTracks)).pipe(reduce(acc => acc, saved))
        : of([])
    })
  ]
  if (isFinite) {
    pipeline.push(reduce((tracks, saved) => tracks.concat(saved), []))
  }
  return pipeline
}

/**
 * Starts to watch a given folders for file addition and removal.
 * Each watcher is turned to an observable that will:
 * - on file addition, add tracks or playlists to their respective service
 * - on file deletion, removes tracks from the tracks service
 *
 * Adds to the `subscriptions` map an observable subscription for each folder watched.
 *
 * _Note_: it does not removes playlists when the original playlist file is gone.
 * @param {array<string>|string} folders  - single, or multiple folders to watch
 * @param {object} logger                 - logger instance
 */
function watch(folders, logger) {
  for (const folder of Array.isArray(folders) ? folders : [folders]) {
    const watchEvents$ = new Observable(function (observer) {
      logger.info({ folder }, `starting watch`)
      const watcher = chokidar
        .watch(folder, {
          ignoreInitial: true,
          disableGlobbing: true,
          awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100
          }
        })
        .on('add', (path, stats) =>
          observer.next({ kind: 'addition', path, stats })
        )
        .on('change', (path, stats) =>
          observer.next({ kind: 'change', path, stats })
        )
        .on('unlink', path => observer.next({ kind: 'deletion', path }))
        .on('error', observer.error.bind(observer))
      return {
        unsubscribe: () => {
          watcher.close()
          logger.info({ folder }, `watcher stopped`)
        }
      }
    }).pipe(
      mergeMap(event =>
        event.kind === 'deletion'
          ? from(tracksModel.getByPaths([event.path])).pipe(
              map(results =>
                results.length
                  ? {
                      ...event,
                      id: results[0].id,
                      stats: { ino: results[0].ino }
                    }
                  : null
              )
            )
          : of(event)
      ),
      filter(n => n),
      tap(({ kind, path, stats }) =>
        logger.debug({ path, ino: stats.ino }, `file ${kind} watched`)
      ),
      share()
    )

    subscriptions.set(
      folder,
      watchEvents$
        .pipe(
          bufferWhen(() => watchEvents$.pipe(debounceTime(250))),
          map(events => {
            const perIno = new Map()
            for (const event of events) {
              const {
                stats: { ino },
                kind
              } = event
              let existing = perIno.get(ino)
              // in case we already have an event for this inode, only keeps the addition one, but also keeps
              // the id from deletion event
              if (existing && existing.kind !== kind) {
                const renameEvent = {
                  ...(kind === 'addition' ? event : existing),
                  id: event.id || existing.id
                }
                const { path, id } = renameEvent
                const { path: oldPath } = kind === 'addition' ? existing : event
                perIno.set(ino, renameEvent)
                logger.debug(
                  { path, oldPath, id, ino },
                  `file renamed (id ${id})`
                )
              } else {
                perIno.set(ino, event)
              }
            }
            return [...perIno.values()]
          }),
          mergeMap(events => from(events)),
          mergeMap(({ kind, path, id, stats }) =>
            kind === 'deletion'
              ? from(tracks.remove([id]))
              : of({ isNew: kind === 'addition', path, stats, id }).pipe(
                  filter(onlySupported(true)),
                  ...makeEnrichAndSavePipeline(logger, 1, false)
                )
          )
        )
        .subscribe({
          next: () => playlists.checkIntegrity(),
          error: logger.error.bind(logger)
        })
    )
  }
}

/**
 * @class LocalProvider
 * Searches on local folders for:
 * - tracks
 * - playlists
 * - artworks
 * - covers
 */
class Local extends AbstractProvider {
  constructor() {
    super('Local')
  }

  /**
   * Finds artwork for a given artist.
   * Searches into the artwork local folder for image files named with the artist name hash.
   * @async
   * @param {string} searched - artist's name
   * @returns {array<Artwork>} list (may be empty) of artworks
   */
  async findArtistArtwork(searched) {
    this.logger.debug({ searched }, `search artist artwork for ${searched}`)
    const prefix = getArtworkFile(hash(searched))
    const results = []
    for (const ext of ['jpeg', 'gif', 'png', 'jpg']) {
      const artwork = `${prefix}.${ext}`
      try {
        await fs.access(artwork, fs.constants.R_OK)
        results.push({ artwork, provider: this.name })
      } catch {
        // ignore missing file
      }
    }
    this.logger.debug(
      { length: results.length, searched },
      `got results for ${searched}`
    )
    return results
  }

  /**
   * Finds covers for a given album.
   * Looks for tracks of the searched folder, then searches for sibling images on the disk.
   * @async
   * @param {string} searched - album's name
   * @returns {array<Cover>} list (may be empty) of covers
   */
  async findAlbumCover(searched) {
    this.logger.debug({ searched }, `search album cover for ${searched}`)
    try {
      const albums = await albumsModel.getByName(searched)
      if (!albums.length) {
        return []
      }
      const results = (await Promise.all(albums.map(findForAlbum))).reduce(
        (all, items) => all.concat(items)
      )
      this.logger.debug(
        { length: results.length, searched },
        `got results for ${searched}`
      )
      return results
    } catch (err) {
      this.logger.error(
        { err, searched },
        `failed to search album cover: ${err.message}`
      )
      return []
    }
  }

  /**
   * Compare tracks stored in database and tracks from the provider, are in sync.
   * Uses folders stored in settings, walks them and collect file path and modification times from the drive.
   * Then compare them with tracks from database.
   *
   * Calls tracks service add() and remove() methods accordingly.
   * Broadcasts `tracking` messages when it starts and stops.
   *
   * _Note_: does not removes playlist when the original playlist file is gone.
   * @async
   */
  async compareTracks() {
    const { folders } = await settingsModel.get()
    const startMs = Date.now()
    this.logger.info({ folders }, `comparing folders...`)
    this.unwatchAll()
    watch(folders, this.logger)
    const existingIds = await tracksModel.listWithTime()
    broadcast('tracking', {
      inProgress: true,
      op: 'compareTracks',
      provider: this.name
    })
    return firstValueFrom(
      of(...(folders || []))
        .pipe(
          mergeMap(
            folder => walk(folder).pipe(filter(onlySupported(true))),
            walkConcurrency
          )
        )
        .pipe(
          filter(({ path, stats: { mtimeMs } }) => {
            const id = hash(path)
            const knownTime = existingIds.get(id)
            existingIds.delete(id)
            if (!knownTime || knownTime < mtimeMs) {
              return true
            }
            return false
          }),
          ...makeEnrichAndSavePipeline(this.logger),
          mergeMap(saved => {
            const removedIds = Array.from(existingIds.keys())
            return (
              removedIds.length ? from(tracks.remove(removedIds)) : EMPTY
            ).pipe(reduce(r => r, { saved, removedIds }))
          }),
          tap(({ saved, removedIds }) => {
            if (saved.length) {
              playlists.checkIntegrity()
            }
            broadcast('tracking', {
              inProgress: false,
              op: 'compareTracks',
              provider: this.name
            })
            this.logger.info(
              {
                folders,
                hits: {
                  savedCount: saved.length,
                  removedCount: removedIds.length
                }
              },
              `folder succesfully compared in ${Date.now() - startMs}ms`
            )
          })
        )
    )
  }

  /**
   * Imports tracks from the provider, calling the tracks service.
   * Uses folders stored in settings, or specified parameters.
   * Walks them and calls tracks service add() method.
   *
   * Broadcasts `tracking` messages when it starts and stops
   * @async
   */
  async importTracks(folders) {
    const { folders: allFolders } = await settingsModel.get()
    if (!Array.isArray(folders)) {
      folders = allFolders
    }
    const startMs = Date.now()
    broadcast('tracking', {
      inProgress: true,
      op: 'importTracks',
      provider: this.name
    })
    // unwatch and re-watch all folders
    this.unwatchAll()
    watch(allFolders, this.logger)
    return firstValueFrom(
      of(...(folders || []))
        .pipe(
          mergeMap(
            folder => walk(folder).pipe(filter(onlySupported())),
            walkConcurrency
          )
        )
        .pipe(
          ...makeEnrichAndSavePipeline(this.logger),
          tap(tracks => {
            if (tracks.length) {
              playlists.checkIntegrity()
            }
            broadcast('tracking', {
              inProgress: false,
              op: 'importTracks',
              provider: this.name
            })
            this.logger.info(
              { folders, hitCount: tracks.length },
              `folder succesfully added in ${Date.now() - startMs}ms`
            )
          })
        )
    )
  }

  unwatchAll() {
    for (const [, sub] of subscriptions) {
      sub.unsubscribe()
    }
    subscriptions.clear()
  }
}

/**
 * Local provider singleton
 * @type {LocalProvider}
 */
const local = new Local()
export default local
