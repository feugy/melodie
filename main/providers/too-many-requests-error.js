'use strict'

module.exports = class TooManyRequestsError extends Error {
  constructor(message, provider) {
    super(message)
    this.provider = provider
    this.code = 429
  }
}
