'use strict'

const { parseFile } = require('music-metadata')
const { getLogger } = require('../utils')

const logger = getLogger('services/tag')

module.exports = {
  async read(path) {
    let tags
    try {
      const { common, format } = await parseFile(path)
      if (!format.duration) {
        format.duration = (
          await parseFile(path, { duration: true })
        ).format.duration
      }
      tags = { ...common, duration: format.duration }
    } catch (error) {
      logger.warn({ error, path }, `failed to read tags`)
    }
    return {
      album: null,
      albumartist: null,
      artist: null,
      artists: [],
      genre: [],
      title: null,
      year: null,
      duration: 0,
      ...tags,
      picture: undefined // TODO for now, don't store pictures
    }
  }
}
