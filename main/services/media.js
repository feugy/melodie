'use strict'

const fs = require('fs-extra')
const stream = require('stream')
const { promisify } = require('util')
const { parse } = require('url')
const { extname, dirname, resolve } = require('path')
const got = require('got')
const mime = require('mime-types')
const { from, of, EMPTY, interval } = require('rxjs')
const {
  mergeMap,
  filter,
  expand,
  take,
  map,
  catchError,
  tap,
  reduce
} = require('rxjs/operators')
const { artistsModel, albumsModel, tracksModel } = require('../models')
const { getLogger, getMediaPath, broadcast, dayMs } = require('../utils')
const {
  audiodb,
  discogs,
  local,
  allProviders,
  TooManyRequestsError
} = require('../providers')

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

module.exports = {
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
  triggerArtistsEnrichment(perMinute = 20) {
    if (subscription && !subscription.isClosed) {
      subscription.unsubscribe()
    }

    const enrichWithProvider = provider => [
      filter(artist => artist && artist.id),
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
                    ? from(
                        artistsModel.save({ ...artist, processedEpoch: now })
                      )
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
  },

  /**
   * Enriches a single artist with artwork and bio from all providers.
   * Bios will be merged together, but first artwork is used.
   * Does nothing if no artist matches specified id, or if the artist already has an avatar and bios.
   * @async
   * @param {number} id - the artist id
   */
  async triggerArtistEnrichment(id) {
    const artist = await artistsModel.getById(id)
    if (!artist || (artist.media && artist.bio)) {
      return
    }
    const results = await this.findForArtist(artist.name)
    let url
    let bios = {}
    for (const { artwork, bio } of results) {
      if (artwork && !url) {
        url = artwork
      }
      if (bio) {
        bios = { ...bio, ...bios }
      }
    }
    if (url || Object.keys(bios).length) {
      await this.saveForArtist(artist.id, url, bios)
    }
  },

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
  triggerAlbumsEnrichment(perMinute = 20) {
    if (subscription && !subscription.isClosed) {
      subscription.unsubscribe()
    }

    const enrichWithProvider = provider => [
      filter(album => album && album.id),
      mergeMap(album =>
        from(provider.findAlbumCover(album.name)).pipe(
          mergeMap(results =>
            results.length
              ? this.saveForAlbum(album.id, results[0].cover)
              : of(album)
          ),
          catchError(err => {
            return err instanceof TooManyRequestsError
              ? of({ ...album, wasLimited: true })
              : EMPTY
          })
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
                reduce((remaining, album) => {
                  return album && album.wasLimited
                    ? [...remaining, { ...album, wasLimited: undefined }]
                    : remaining
                }, [])
              )
            : EMPTY
        )
      )
      .subscribe()
  },

  /**
   * Stops enriching albums or artists.
   */
  stopEnrichment() {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
  },

  /**
   * Finds potential artworks an all providers for a given artist
   * @async
   * @param {string} name - name of that artist
   * @returns {array<Artwork>} a list (may be empty) of possible artworks
   */
  async findForArtist(name) {
    if (!name) {
      return []
    }
    const requests = await Promise.allSettled(
      allProviders.map(provider => provider.findArtistArtwork(name))
    )
    return requests.reduce(
      (results, { value = [] }) => [...results, ...value],
      []
    )
  },

  /**
   * Finds potential cover an all providers for a given album
   * @async
   * @param {string} name - name of that album
   * @returns {array<Cover>} a list (may be empty) of possible covers
   */
  async findForAlbum(name) {
    if (!name) {
      return []
    }
    const requests = await Promise.allSettled(
      allProviders.map(provider => provider.findAlbumCover(name))
    )
    return requests.reduce(
      (results, { value = [] }) => [...results, ...value],
      []
    )
  },

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
  async saveForArtist(id, url, bio = null) {
    const artist = await artistsModel.getById(id)
    if (!artist) {
      logger.warn({ id, url }, `unknown artist ${id}: skipping artwork update`)
      return
    }
    let hasChanged = false

    if (url) {
      let path = getMediaPath(id)
      await fs.ensureFile(`${path}.tmp`)
      try {
        const media = await downloadAndSave(path, url)
        logger.debug(
          { id, url, media },
          `media successfully downloaded for artist ${artist.name}`
        )
        artist.media = media
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
      broadcast('artist-changes', [{ ...artist, media: null }, saved[0]])
      logger.debug(
        { id, url, media: artist.media },
        `media successfully saved into artist ${artist.name}`
      )
    }
  },

  /**
   * Save an album's cover.
   * Downloads content from the given url, and use it as cover.
   * Broadcasts two `album-changes` events so UI could detect change even when the media path is the same.
   * Also updates the cover off all contained tracks, broadcasting two `track-changes` event with them.
   * @async
   * @param {number} id   - album's id
   * @param {string} url  - cover url (could be a local file)
   */
  async saveForAlbum(id, url) {
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
      const { saved } = await albumsModel.save({ ...album, media })
      // broadcast 2 changes so UI would detect changes event when the media path is the same
      broadcast('album-changes', [{ ...album, media: null }, saved[0]])
      logger.debug(
        { id, url, media },
        `media successfully saved into album ${album.name}`
      )
      const savedTracks = tracks.map(track => ({ ...track, media }))
      await tracksModel.save(savedTracks)
      const resetedTracks = []
      for (const track of savedTracks) {
        resetedTracks.push({ ...track, media: null })
        logger.debug(
          { id: track.id, url, media },
          `media successfully saved for track ${track.path}`
        )
      }
      // split in 2 different messages for UI to update
      broadcast('track-changes', resetedTracks)
      broadcast('track-changes', savedTracks)
    }
  }
}
