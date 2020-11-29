'use strict'

const { parseFile, selectCover } = require('music-metadata')
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
   * @property {IPicture} [cover]       - album's cover picture, when set
   * @property {string} cover.format      - cover's MIME type
   * @property {Buffer} cover.data        - cover's binary data
   * There may be other fields, @see https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md
   * @see https://github.com/borewit/music-metadata#access-cover-art
   */

  /**
   * Reads music metadata from file.
   * _Note_: pictures are intentionally removed, but cover is returned when present, as an IPicture object
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
      tags = {
        ...common,
        cover: selectCover(common.picture),
        duration: format.duration
      }
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
      cover: null,
      ...tags,
      picture: undefined // don't returns embedded pictures
    }
  }
}
