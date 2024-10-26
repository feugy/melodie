import { parseFile, selectCover } from 'music-metadata'
import { basename, dirname } from 'path'

import { getLogger } from '../../utils/index.js'

const logger = getLogger('providers/local')

const titleRegex = /^(\d*)\s*[.-]?(?:([^-]+)-)?(.+)\.\w+$/i
const albumRegex = /^(?:\((\d*)\)\s+)?(.+)$/i

/**
 * List of supported file formats.
 */
export const formats = [
  '.mp3',
  '.ogg',
  '.flac',
  '.webm',
  '.weba',
  '.opus',
  '.wav'
]

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
export async function read(path) {
  let tags = {}
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
  if (!tags.title || !tags.artist) {
    const match = titleRegex.exec(basename(path))
    if (match) {
      const [, num, artist, title] = match
      tags.title = tags.title || title?.trim() || null
      tags.artist = tags.artist || artist?.trim() || null
      if (!tags?.track?.no && !!num) {
        tags.track = { no: parseInt(num), of: tags?.track?.of || null }
      }
    }
  }
  if (!tags.album || !tags.year) {
    const match = albumRegex.exec(basename(dirname(path)))
    if (match) {
      const [, year, album] = match
      tags.album = tags.album || album?.trim() || null
      if (!tags.year && !!year) {
        tags.year = parseInt(year)
      }
    }
  }
  // TODO discs
  return {
    album: null,
    artist: null,
    artists: [],
    albumartist: null,
    genre: [],
    title: null,
    year: null,
    cover: null,
    ...tags,
    duration: tags.duration || 0,
    picture: undefined // don't returns embedded pictures
  }
}
