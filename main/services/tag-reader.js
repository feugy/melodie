'use strict'

const { parseFile } = require('music-metadata')

module.exports = {
  async read(path) {
    let tags
    try {
      tags = (await parseFile(path)).common
    } catch {
      // ignore errors for now
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
