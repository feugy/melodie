'use strict'

const got = require('got')
const fs = require('fs-extra')
const stream = require('stream')
const { promisify } = require('util')
const { parse } = require('url')
const { extname, dirname, resolve } = require('path')
const { artistsModel, albumsModel, tracksModel } = require('../models')
const { getLogger, getMediaPath, broadcast } = require('../utils')
const providers = require('../providers')

const pipeline = promisify(stream.pipeline)

const logger = getLogger('services/media')

module.exports = {
  async findForArtist(name) {
    const requests = await Promise.all(
      providers.map(provider => provider.findArtistArtwork(name))
    )
    return requests.reduce((results, value) => [...results, ...value])
  },

  async findForAlbum(name) {
    const requests = await Promise.all(
      providers.map(provider => provider.findAlbumCover(name))
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
      const { protocol } = parse(url)
      const isRemote = protocol && protocol.startsWith('http')
      const source = isRemote ? got.stream(url) : fs.createReadStream(url)
      let ext = extname(url)
      if (isRemote) {
        source.once(
          'response',
          ({ headers }) => (ext = `.${headers['content-type'].split('/')[1]}`)
        )
      }
      await pipeline(source, fs.createWriteStream(`${media}.tmp`))

      await fs.move(`${media}.tmp`, `${media}${ext}`, { overwrite: true })
      written = true
      media = `${media}${ext}`
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
      const { protocol } = parse(url)
      const isRemote = protocol && protocol.startsWith('http')
      const source = isRemote ? got.stream(url) : fs.createReadStream(url)
      let ext = extname(url)
      if (isRemote) {
        source.once(
          'response',
          ({ headers }) => (ext = `.${headers['content-type'].split('/')[1]}`)
        )
      }
      await pipeline(source, fs.createWriteStream(`${media}.tmp`))

      await fs.move(`${media}.tmp`, `${media}${ext}`, { overwrite: true })
      written = true
      media = `${media}${ext}`
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
        `media successfully saved into artist ${album.name}`
      )
      const savedTracks = tracks.map(track => ({ ...track, media }))
      await tracksModel.save(savedTracks)
      for (const track of savedTracks) {
        broadcast('track-change', { ...track, media: null })
        broadcast('track-change', track)
        logger.debug(
          { id: track.id, url, media },
          `media successfully saved for track artist ${track.path}`
        )
      }
    }
  }
}
