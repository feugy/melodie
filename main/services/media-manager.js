'use strict'

const got = require('got')
const fs = require('fs-extra')
const stream = require('stream')
const { promisify } = require('util')
const { parse } = require('url')
const { extname } = require('path')
const { artistsModel } = require('../models/artists')
const { getLogger, getMediaPath, broadcast } = require('../utils')

const pipeline = promisify(stream.pipeline)

const logger = getLogger('services/media')

module.exports = {
  async saveForArtist(id, url) {
    const artist = await artistsModel.getById(id)
    if (!artist) {
      logger.warn({ id, url }, `unknown artist ${id}: skipping media download`)
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
  }

  // TODO async saveForAlbum(id, url) {}
}
