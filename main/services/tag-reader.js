'use strict'

const { parseFile } = require('music-metadata')
const { getLogger } = require('../utils')

const logger = getLogger('services/tag')

module.exports = {
  async read(path) {
    let tags
    try {
      tags = (await parseFile(path)).common
    } catch (error) {
      logger.warn({ error, path }, `failed to read tags`)
    }
    return {
      album: null,
      artist: null,
      artists: [],
      genre: [],
      title: null,
      year: null,
      ...tags,
      picture: undefined // TODO for now, don't store pictures
    }
  }
}
