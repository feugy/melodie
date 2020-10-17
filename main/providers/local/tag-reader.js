'use strict'

const { parseFile } = require('music-metadata')
const { getLogger } = require('../../utils')

const logger = getLogger('providers/local')

module.exports = {
  /**
   * List of supported file formats.
   */
  formats: ['.mp3', '.ogg', '.flac'],

  /**
   * @typedef {object} Tags
   * @property {string} album           - track's album
   * @property {string} albumartist     - album's main artist
   * @property {string} artist          - track's main artist
   * @property {array<string>} artists  - track's artists
   * @property {string} genre           - track's musical genre
   * @property {string} title           - track's title
   * @property {number} year            - track's release year
   * @property {number} duration        - track's duration in seconds
   * There may be other fields, @see https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md
   */

  /**
   * Reads music metadata from file.
   * _Note_: picture are intentionally removed.
   * @async
   * @param {string} path - path of the file to parse
   * @returns {Tags} parsed metadata
   */
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
