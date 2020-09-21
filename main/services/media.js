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

async function downloadAndSave(media, url) {
  const { protocol } = parse(url)
  const isRemote = protocol && protocol.startsWith('http')
  const source = isRemote ? got.stream(url) : fs.createReadStream(url)
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
              ? this.saveForArtist(artist.id, results[0].full)
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
              ? this.saveForAlbum(album.id, results[0].full)
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

  stopEnrichment() {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
  },

  async findForArtist(name) {
    const requests = await Promise.all(
      allProviders.map(provider => provider.findArtistArtwork(name))
    )
    return requests.reduce((results, value) => [...results, ...value])
  },

  async findForAlbum(name) {
    const requests = await Promise.all(
      allProviders.map(provider => provider.findAlbumCover(name))
    )
    return requests.reduce((results, value) => [...results, ...value])
  },

  async saveForArtist(id, url) {
    const artist = await artistsModel.getById(id)
    if (!artist) {
      logger.warn({ id, url }, `unknown artist ${id}: skipping artwork update`)
      return
    }
    let media = getMediaPath(id)
    await fs.ensureFile(`${media}.tmp`)

    let written = false
    try {
      media = await downloadAndSave(media, url)
      written = true
      logger.debug(
        { id, url, media },
        `media successfully downloaded for artist ${artist.name}`
      )
    } catch (err) {
      logger.info(
        { err, id, url },
        `failed to download media for artist ${artist.name}: ${err.message}`
      )
    }

    if (written) {
      const { saved } = await artistsModel.save({ ...artist, media })
      // broadcast 2 changes so UI would detect changes event when the media path is the same
      broadcast('artist-change', { ...artist, media: null })
      broadcast('artist-change', saved[0])
      logger.debug(
        { id, url, media },
        `media successfully saved into artist ${artist.name}`
      )
    }
  },

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
      broadcast('album-change', { ...album, media: null })
      broadcast('album-change', saved[0])
      logger.debug(
        { id, url, media },
        `media successfully saved into album ${album.name}`
      )
      const savedTracks = tracks.map(track => ({ ...track, media }))
      await tracksModel.save(savedTracks)
      for (const track of savedTracks) {
        broadcast('track-change', { ...track, media: null })
        broadcast('track-change', track)
        logger.debug(
          { id: track.id, url, media },
          `media successfully saved for track ${track.path}`
        )
      }
    }
  }
}
