import app from '../../package.json' assert { type: 'json' }
import { getLogger } from '../utils/index.js'
import { TooManyRequestsError } from './too-many-requests-error.js'

/**
 * @class AbstractProvider
 * Base class for data providers:
 * - tracks
 * - playlists
 * - artworks
 * - covers
 * Subclasses may only support a subset of these methods, as default implementation are no-ops.
 */
export default class AbstractProvider {
  /**
   * Builds a provider.
   * @param {string} name                     - provider name, for logging
   * @param {number} [requestsPerMinute=null] - maximum of requests allowed per minutes. Set to null to
   *                                            disable.
   */
  constructor(name, requestsPerMinute = null) {
    this.name = name
    this.requestsPerMinute = requestsPerMinute
    this.userAgent = `${app.name}/${app.version}`
    this.logger = getLogger(`providers/${this.name.toLowerCase()}`)
    this.lastReqEpoch = 0
    this.init()
  }

  /**
   * Initialization function, for providers that needs external configuration.
   * Does nothing
   */
  init() {}

  /**
   * Checks that this function hasn't been called more than the expected threshold during the last minute.
   * If the threshold (this.requestsPerMinute) is reached, throws an error.
   * @param {string} operation - operation name, for error reporting
   * @throws {TooManyRequestsError} if this function was called too many times during the last minute
   */
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

  /**
   * @typedef {object} Artwork
   * @property {string} artwork   - path to an image file
   * @property {object} bio       - biography: each key is a language code
   * @property {string} bio[*]    - biography of a given language
   * @property {string} provider  - provider name
   */

  /**
   * Finds artworks for a given artist.
   * @async
   * @param {string} searched - artist's name
   * @returns {array<Artwork>} list (may be empty) of artworks
   */
  async findArtistArtwork() {
    return []
  }

  /**
   * @typedef {object} Cover
   * @property {string} cover     - path to an image file
   * @property {string} provider  - provider name
   */

  /**
   * Finds covers for a given album.
   * @async
   * @param {string} searched - album's name
   * @returns {array<Cover>} list (may be empty) of covers
   */
  async findAlbumCover() {
    return []
  }

  /**
   * Imports tracks from the provider, calling the tracks service.
   * @async
   */
  async importTracks() {
    return []
  }

  /**
   * Compare tracks stored in database and tracks from the provider, are in sync.
   * Calls tracks service methods accordingly.
   * @async
   */
  async compareTracks() {
    return { saved: [], removedIds: [] }
  }
}
