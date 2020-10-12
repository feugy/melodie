'use strict'

const { extname } = require('path')
const fs = require('fs-extra')
const {
  of,
  Observable,
  forkJoin,
  from,
  merge,
  EMPTY,
  partition
} = require('rxjs')
const {
  mergeMap,
  filter,
  reduce,
  bufferCount,
  map,
  tap,
  share
} = require('rxjs/operators')
const chokidar = require('chokidar')
const AbstractProvider = require('../abstract-provider')
const { albumsModel, settingsModel, tracksModel } = require('../../models')
// do not import ../../services to avoid circular dep
const tracks = require('../../services/tracks')
const { hash, broadcast, walk, getMediaPath } = require('../../utils')
const { findInFolder, findForAlbum } = require('./cover-finder')
const tag = require('./tag-reader')

const readConcurrency = 10
const walkConcurrency = 2
const saveThreshold = 50
const supported = ['.mp3', '.ogg', '.flac']
const subscriptions = new Map()

function onlySupported({ path, stats }) {
  return (
    (!stats || stats.isFile()) &&
    supported.includes(extname(path).toLowerCase())
  )
}

function makeEnrichAndSavePipeline(bufferSize = saveThreshold) {
  return [
    mergeMap(
      ({ path, stats: { mtimeMs } }) =>
        forkJoin({
          id: of(hash(path)),
          path: of(path),
          tags: from(tag.read(path)),
          media: from(findInFolder(path)),
          mtimeMs: of(mtimeMs)
        }),
      readConcurrency
    ),
    bufferCount(bufferSize),
    mergeMap(saved => from(tracks.add(saved)).pipe(reduce(acc => acc, saved))),
    reduce((tracks, saved) => tracks.concat(saved), [])
  ]
}

function watch(folders, logger) {
  for (const folder of Array.isArray(folders) ? folders : [folders]) {
    const [additions, removals] = partition(
      new Observable(function (observer) {
        const onSave = path => {
          logger.debug({ path }, 'file change watched')
          observer.next({ isSave: true, path })
        }
        const onRemove = path => {
          logger.debug({ path }, 'file deletion watched')
          observer.next({ isSave: false, path })
        }
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
          .on('add', onSave)
          .on('change', onSave)
          .on('unlink', onRemove)
          .on('error', observer.error.bind(observer))
        return {
          unsubscribe: () => {
            watcher.close()
            logger.info({ folder }, `watcher stopped`)
          }
        }
      }).pipe(share()),
      ({ isSave }) => isSave
    )

    subscriptions.set(
      folder,
      merge(
        additions.pipe(
          mergeMap(({ path }) =>
            from(fs.stat(path)).pipe(map(stats => ({ path, stats })))
          ),
          filter(onlySupported),
          ...makeEnrichAndSavePipeline(1)
        ),
        removals.pipe(
          filter(onlySupported),
          mergeMap(({ path }) => from(tracks.remove([hash(path)])))
        )
      ).subscribe()
    )
  }
}

class Local extends AbstractProvider {
  constructor() {
    super('Local')
  }

  async findArtistArtwork(searched) {
    this.logger.debug({ searched }, `search artist artwork for ${searched}`)
    const prefix = getMediaPath(hash(searched))
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

  async findAlbumCover(searched) {
    this.logger.debug({ searched }, `search album cover for ${searched}`)
    try {
      const albums = await albumsModel.getByName(searched)
      if (!albums.length) {
        return []
      }
      const results = (
        await Promise.all(albums.map(findForAlbum))
      ).reduce((all, items) => all.concat(items))
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
    return of(...(folders || []))
      .pipe(
        mergeMap(
          folder => walk(folder).pipe(filter(onlySupported)),
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
        ...makeEnrichAndSavePipeline(),
        mergeMap(saved => {
          const removedIds = Array.from(existingIds.keys())
          return (removedIds.length
            ? from(tracks.remove(removedIds))
            : EMPTY
          ).pipe(reduce(r => r, { saved, removedIds }))
        }),
        tap(({ saved, removedIds }) => {
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
      .toPromise()
  }

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
    return of(...(folders || []))
      .pipe(
        mergeMap(
          folder => walk(folder).pipe(filter(onlySupported)),
          walkConcurrency
        )
      )
      .pipe(
        ...makeEnrichAndSavePipeline(),
        tap(tracks => {
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
      .toPromise()
  }

  unwatchAll() {
    for (const [, sub] of subscriptions) {
      sub.unsubscribe()
    }
    subscriptions.clear()
  }
}

module.exports = new Local()
