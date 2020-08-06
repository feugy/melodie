'use strict'

const got = require('got')
const fs = require('fs-extra')
const stream = require('stream')
const { promisify } = require('util')
const { parse } = require('url')
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
    const media = getMediaPath(id, url)
    await fs.ensureFile(`${media}.tmp`)

    let written = false
    try {
      const { protocol } = parse(url)
      await pipeline(
        protocol && protocol.startsWith('http')
          ? got.stream(url)
          : fs.createReadStream(url),
        fs.createWriteStream(`${media}.tmp`)
      )
      await fs.move(`${media}.tmp`, media, { overwrite: true })
      written = true
      logger.debug(
        { id, url, media },
        `media successfully downloaded for artist ${artist.name}`
      )
    } catch (err) {
      logger.info(
        { err, id, url, media },
        `failed to download media for artist ${artist.name}: ${err.message}`
      )
    }

    if (written) {
      const { saved } = await artistsModel.save({ ...artist, media })
      broadcast('artist-change', saved[0])
      logger.debug(
        { id, url, media },
        `media successfully saved into artist ${artist.name}`
      )
    }
  }

  // TODO async saveForAlbum(id, url) {}
}
