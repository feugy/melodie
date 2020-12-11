'use strict'

/**
 * Error used when capping the number of request of a given provider.
 * @class
 * @extends Error
 * @property {string} provider  - provider name
 * @property {number} code      - an error code (429)
 */
module.exports = class TooManyRequestsError extends Error {
  /**
   * Constructs a new error.
   * @param {string} message  - error message
   * @param {string} provider - provider name
   */
  constructor(message, provider) {
    super(message)
    this.provider = provider
    this.code = 429
  }
}
