import fs from 'fs-extra'
import got from 'got'
import mime from 'mime-types'
import { dirname, extname, resolve } from 'path'
import { EMPTY, from, interval, of } from 'rxjs'
import {
  catchError,
  expand,
  filter,
  map,
  mergeMap,
  reduce,
  take,
  tap
} from 'rxjs/operators'
import stream from 'stream'
import { parse } from 'url'
import { promisify } from 'util'

import {
  albumsModel,
  artistsModel,
  settingsModel,
  tracksModel
} from '../models/index.js'
import {
  allProviders,
  audiodb,
  discogs,
  local,
  TooManyRequestsError
} from '../providers/index.js'
import { broadcast, dayMs, getArtworkFile, getLogger } from '../utils/index.js'

const pipeline = promisify(stream.pipeline)
const logger = getLogger('services/media')

/**
 * Downloads content from an url and save it on local drive as `media`.
 * The final extension will come from the downloaded mime type.
 * @async
 * @param {string} media  - path to the saved media, with no extension
 * @param {string} url    - url of the new content (could be a local file)
 * @returns {string} the saved media path, with extension
 */
async function downloadAndSave(media, url) {
  const { protocol } = parse(url)
  const isRemote = protocol && protocol.startsWith('http')
  const source = isRemote
    ? got.stream(url, { timeout: { send: 3e3, response: 3e3, lookup: 500 } })
    : fs.createReadStream(url)
  let ext = extname(url)
  if (isRemote) {
    source.once(
      'response',
      ({ headers }) => (ext = `.${mime.extension(headers['content-type'])}`)
    )
  }
  await pipeline(source, fs.createWriteStream(`${media}.tmp`))

  await fs.move(`${media}.tmp`, `${media}${ext}`, { overwrite: true })
  return `${media}${ext}`
}

let subscription

function makeModelFileRetriever(modelClass, forPath = false) {
  return async (id, count) => {
    const model = await modelClass.getById(id)
    if (!model || (!forPath && model.mediaCount !== count)) {
      return null
    }
    return forPath ? model.path : model.media
  }
}

function prependEndpoint(results, property) {
  return results.map(result => ({
    ...result,
    [property]: result[property]
      ? result[property].startsWith('http')
        ? result[property]
        : `/media?path=${encodeURIComponent(result[property])}`
      : undefined
  }))
}

/**
 * Triggers enrichement of all artists: will fetch artwork from (in order):
 * - local
 * - AudioDB
 * - Discogs
 * First matching artwork will be saved, and if no results are found, the current epoch is
 * saved to avoid reprocessing it until tomorrow.
 * It will stops any existing enrichement.
 * @param {number} [perMinute = 20] - maximum artist processed per minute
 */
export function triggerArtistsEnrichment(perMinute = 20) {
  if (subscription && !subscription.isClosed) {
    subscription.unsubscribe()
  }

  const enrichWithProvider = provider => [
    filter(artist => artist && artist.id && artist.name),
    mergeMap(artist =>
      from(provider.findArtistArtwork(artist.name)).pipe(
        mergeMap(results =>
          results.length
            ? this.saveForArtist(artist.id, results[0].artwork)
            : of(artist)
        ),
        catchError(err => {
          return err instanceof TooManyRequestsError
            ? of({ ...artist, wasLimited: true })
            : EMPTY
        })
      )
    )
  ]

  const now = Date.now()
  subscription = from(artistsModel.listMedialess(now - dayMs))
    .pipe(
      tap(artists =>
        logger.debug(
          { total: artists.length },
          `triggering artwork enrichments for artists`
        )
      ),
      expand(input =>
        Array.isArray(input) && input.length
          ? interval(60000 / perMinute).pipe(
              take(input.length),
              map(i => input[i]),
              tap(artist =>
                logger.debug(
                  { artist },
                  `automatically searching artwork for ${artist.name}`
                )
              ),
              ...enrichWithProvider(local),
              ...enrichWithProvider(audiodb),
              ...enrichWithProvider(discogs),
              mergeMap(artist =>
                artist && !artist.wasLimited
                  ? from(artistsModel.save({ ...artist, processedEpoch: now }))
                  : of(artist)
              ),
              reduce((remaining, artist) => {
                return artist && artist.wasLimited
                  ? [...remaining, { ...artist, wasLimited: undefined }]
                  : remaining
              }, [])
            )
          : EMPTY
      )
    )
    .subscribe()
}

/**
 * Enriches a single artist with artwork and bio from all providers.
 * Bios will be merged together, but first artwork is used.
 * Does nothing if no artist matches specified id, or if the artist already has artwork and bios.
 * Does not override local artwork with online results.
 * @async
 * @param {number} id - the artist id
 */
export async function triggerArtistEnrichment(id) {
  const artist = await artistsModel.getById(id)
  const { locale } = await settingsModel.get()
  if (!artist || (artist.media && artist.bio && locale in artist.bio)) {
    return
  }
  const results = await this.findForArtist(artist.name)
  let url
  let bios = {}
  for (const { artwork, bio, provider } of results) {
    if (artwork && !url && provider !== local.name) {
      url = artwork
    }
    if (bio) {
      bios = { ...bio, ...bios }
    }
  }
  if (url || Object.keys(bios).length) {
    await this.saveForArtist(artist.id, artist.media ? null : url, bios)
  }
}

/**
 * Triggers enrichement of all albums: will fetch cover from (in order):
 * - local
 * - AudioDB
 * - Discogs
 * First matching cover will be saved, and if no results are found, the current epoch is
 * saved to avoid reprocessing it until tomorrow.
 * It will stops any existing enrichement.
 * @param {number} [perMinute = 20] - maximum albums processed per minute
 */
export function triggerAlbumsEnrichment(perMinute = 20) {
  if (subscription && !subscription.isClosed) {
    subscription.unsubscribe()
  }

  const enrichWithProvider = provider => [
    filter(album => album && album.id && album.name),
    mergeMap(album =>
      from(provider.findAlbumCover(album.name)).pipe(
        mergeMap(results => {
          return results.length
            ? this.saveForAlbum(album.id, results[0].cover)
            : of(album)
        }),
        catchError(err =>
          err instanceof TooManyRequestsError
            ? of({ ...album, wasLimited: true })
            : EMPTY
        )
      )
    )
  ]

  const now = Date.now()
  subscription = from(albumsModel.listMedialess(now - dayMs))
    .pipe(
      tap(albums =>
        logger.debug(
          { total: albums.length },
          `triggering cover enrichments for albums`
        )
      ),
      expand(input =>
        Array.isArray(input) && input.length
          ? interval(60000 / perMinute).pipe(
              take(input.length),
              map(i => input[i]),
              tap(album =>
                logger.debug(
                  { album },
                  `automatically searching cover for ${album.name}`
                )
              ),
              ...enrichWithProvider(local),
              ...enrichWithProvider(audiodb),
              ...enrichWithProvider(discogs),
              mergeMap(album =>
                album && !album.wasLimited
                  ? from(albumsModel.save({ ...album, processedEpoch: now }))
                  : of(album)
              ),
              reduce(
                (remaining, album) =>
                  album && album.wasLimited
                    ? [...remaining, { ...album, wasLimited: undefined }]
                    : remaining,
                []
              )
            )
          : EMPTY
      )
    )
    .subscribe()
}

/**
 * Stops enriching albums or artists.
 */
export function stopEnrichment() {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
}

/**
 * Finds potential artworks and bios on all providers for a given artist
 * @async
 * @param {string} name - name of that artist
 * @returns {array<Artwork>} a list (may be empty) of possible artworks
 */
export async function findForArtist(name) {
  if (!name) {
    return []
  }
  const requests = await Promise.allSettled(
    allProviders.map(provider => provider.findArtistArtwork(name))
  )
  return requests.reduce(
    (results, { value = [] }) => [
      ...results,
      ...prependEndpoint(value, 'artwork')
    ],
    []
  )
}

/**
 * Finds potential cover an all providers for a given album
 * @async
 * @param {string} name - name of that album
 * @returns {array<Cover>} a list (may be empty) of possible covers
 */
export async function findForAlbum(name) {
  if (!name) {
    return []
  }
  const requests = await Promise.allSettled(
    allProviders.map(provider => provider.findAlbumCover(name))
  )
  return requests.reduce(
    (results, { value = [] }) => [
      ...results,
      ...prependEndpoint(value, 'cover')
    ],
    []
  )
}

/**
 * Save an artist's artwork and bios.
 * Downloads content from the given url, and use it as artwork.
 * If bios are passed, they will erase existing ones.
 * Broadcasts two `artist-changes` events so UI could detect change even when the media path is the same.
 * @async
 * @param {number} id           - artist's id
 * @param {string} url          - artwork url (could be a local file)
 * @param {object} [bio = null] - artist's bio, keys being the language code
 */
export async function saveForArtist(id, url, bio = null) {
  const artist = await artistsModel.getById(id)
  if (!artist) {
    logger.warn({ id, url }, `unknown artist ${id}: skipping artwork update`)
    return
  }
  let hasChanged = false

  if (url) {
    let path = getArtworkFile(id)
    await fs.ensureFile(`${path}.tmp`)
    try {
      const media = await downloadAndSave(path, url)
      logger.debug(
        { id, url, media },
        `media successfully downloaded for artist ${artist.name}`
      )
      artist.media = media
      artist.mediaCount++
      hasChanged = true
    } catch (err) {
      logger.info(
        { err, id, url },
        `failed to download media for artist ${artist.name}: ${err.message}`
      )
    }
  }
  if (bio && Object.keys(bio).length) {
    artist.bio = bio
    hasChanged = true
  }

  if (hasChanged) {
    const { saved } = await artistsModel.save(artist)
    broadcast('artist-changes', saved.map(artistsModel.serializeForUi))
    logger.debug(
      { id, url, media: artist.media },
      `media successfully saved into artist ${artist.name}`
    )
  }
}

/**
 * Save an album's cover.
 * Downloads content from the given url, and use it as cover.
 * Broadcasts two `album-changes` events so UI could detect change even when the media path is the same.
 * Also updates the cover off all contained tracks, broadcasting two `track-changes` event with them.
 * @async
 * @param {number} id   - album's id
 * @param {string} url  - cover url (could be a local file)
 */
export async function saveForAlbum(id, url) {
  const album = await albumsModel.getById(id)
  if (!album) {
    logger.warn({ id, url }, `unknown album ${id}: skipping cover update`)
    return
  }
  const tracks = await tracksModel.getByIds(album.trackIds)
  // consider that first track is included in album's folder
  let media = resolve(dirname(tracks[0].path), 'cover')
  await fs.ensureFile(`${media}.tmp`)

  let written = false
  try {
    media = await downloadAndSave(media, url)
    written = true
    logger.debug(
      { id, url, media },
      `media successfully downloaded for album ${album.name}`
    )
  } catch (err) {
    logger.info(
      { err, id, url },
      `failed to download media for album ${album.name}: ${err.message}`
    )
  }

  if (written) {
    const { saved } = await albumsModel.save({
      ...album,
      media,
      mediaCount: album.mediaCount + 1
    })
    broadcast('album-changes', saved.map(albumsModel.serializeForUi))
    logger.debug(
      { id, url, media },
      `media successfully saved into album ${album.name}`
    )
    const savedTracks = tracks.map(track => ({
      ...track,
      media,
      mediaCount: track.mediaCount + 1
    }))
    await tracksModel.save(savedTracks)
    for (const track of savedTracks) {
      logger.debug(
        { id: track.id, url, media },
        `media successfully saved for track ${track.path}`
      )
    }
    broadcast('track-changes', savedTracks.map(tracksModel.serializeForUi))
  }
}

/**
 * Returns actual path to a track's data file
 * @async
 * @param {number} id - track's id
 * @returns {string} path to the track's file, or null if track does not exist
 */
export const getTrackData = makeModelFileRetriever(tracksModel, true)

/**
 * Returns actual path to a track's cover file
 * @async
 * @param {number} id         - track's id
 * @param {number} mediaCount - current media count
 * @returns {string} path to the track's cover file, or null if track does not exist or if the media count doesn't match
 */
export const getTrackMedia = makeModelFileRetriever(tracksModel)

/**
 * Returns actual path to a album's cover file
 * @async
 * @param {number} id         - album's id
 * @param {number} mediaCount - current media count
 * @returns {string} path to the album's cover file, or null if album does not exist or if the media count doesn't match
 */
export const getAlbumMedia = makeModelFileRetriever(albumsModel)

/**
 * Returns actual path to a artist's artwork file
 * @async
 * @param {number} id         - artist's id
 * @param {number} mediaCount - current media count
 * @returns {string} path to the artist's artwork file, or null if artist does not exist or if the media count doesn't match
 */
export const getArtistMedia = makeModelFileRetriever(artistsModel)

/**
 * Indicates whether a file pointed by desired path can be used as artwork or cover.
 * Only allows image medias, within the watched folders (for obvious security reasons)
 * @async
 * @param {string} path - desired media path
 * @returns {boolean} path to the artist's artwork file, or null if artist does not exist or if the media count doesn't match
 */
export async function isMediaAllowed(path) {
  const type = mime.lookup(extname(path ?? ''))
  if (
    type !== 'image/jpeg' &&
    type !== 'image/gif' &&
    type !== 'image/png' &&
    type !== 'image/bmp'
  ) {
    return false
  }
  const { folders } = await settingsModel.get()
  const normalized = resolve(decodeURIComponent(path))
  for (const folder of folders) {
    if (normalized.startsWith(folder)) {
      return true
    }
  }
  return false
}
