'use strict'

const app = require('../../package')
const { getLogger } = require('../utils')
const TooManyRequestsError = require('./too-many-requests-error')

module.exports = class AbstractProvider {
  constructor(name, requestsPerMinute = null) {
    this.name = name
    this.requestsPerMinute = requestsPerMinute
    this.userAgent = `${app.name}/${app.version}`
    this.logger = getLogger(`providers/${this.name.toLowerCase()}`)
    this.lastReqEpoch = 0
    this.init()
  }

  init() {}

  checkRate(operation) {
    const now = Date.now()
    if (
      this.requestsPerMinute &&
      now - this.lastReqEpoch < 60000 / this.requestsPerMinute
    ) {
      throw new TooManyRequestsError(operation, this.name)
    }
    this.lastReqEpoch = now
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
