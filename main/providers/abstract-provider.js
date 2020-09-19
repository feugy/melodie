'use strict'

const app = require('../../package')
const { getLogger } = require('../utils')

module.exports = class AbstractProvider {
  constructor(name) {
    this.name = name
    this.userAgent = `${app.name}/${app.version}`
    this.logger = getLogger(`providers/${this.name.toLowerCase()}`)
  }

  async findArtistArtwork() {
    return []
  }

  async findAlbumCover() {
    return []
  }

  async importTracks() {
    return []
  }

  async compareTracks() {
    return { saved: [], removedIds: [] }
  }
}
