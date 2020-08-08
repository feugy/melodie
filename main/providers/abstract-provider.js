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
    throw new Error(`${this.name} does not support findArtistArtwork()`)
  }

  async findAlbumCover() {
    throw new Error(`${this.name} does not support findAlbumCover()`)
  }
}
