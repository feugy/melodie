'use strict'

const {
  basename,
  dirname,
  extname,
  isAbsolute,
  resolve,
  relative
} = require('path')
const fs = require('fs-extra')
const { getLogger, hash } = require('../../utils')
const tag = require('./tag-reader')

const logger = getLogger('providers/local')

const formats = ['.m3u', '.m3u8']

module.exports = {
  /**
   * List of supported file formats.
   */
  formats,

  /**
   * Detects whether a given path is a playlist file (.m3u).
   * @param {string} path - tested path
   * @returns {boolean} true if the path is a playlist file, false otherwise
   */
  isPlaylistFile(path) {
    return formats.includes(extname(path).toLowerCase())
  },

  /**
   * Parses playlist files into Playlist models.
   * Supported formats: m3u & m3u8.
   * Handles:
   * - absolute path to file
   * - relative path to file (relative to the playlist file path)
   * - file:// protocol
   * - #PLAYLIST directive
   * Web urls, nested folders and playlists are not supported.
   *
   * It assumes that track's id are hash of their path, which will not work for tracks that were moved.
   * It is an acceptable caveat, given loading tracks by path is likely to fail during the first import
   * of a folder, and given loading playlist makes most sense during this initial import.
   *
   * @async
   * @param {string} path - path of the file to parse
   * @returns {PlaylistModel} parsed playlist, or null in case of error
   * @see https://en.wikipedia.org/wiki/M3U
   */
  async read(path) {
    try {
      const lines = await fs.readFile(
        path,
        extname(path) === '.m3u' ? 'latin1' : 'utf8'
      )
      const playlist = {
        id: hash(path),
        name: basename(path).replace(/\.m3u.?$/, ''),
        trackIds: []
      }
      const root = dirname(path)
      for (const line of lines.split('\n')) {
        if (
          line.trim().length &&
          !line.startsWith('#') &&
          !line.startsWith('http')
        ) {
          // decodes urls to absolute paths
          let path = line.startsWith('file://')
            ? decodeURI(line).slice(7)
            : line
          if (!isAbsolute(path)) {
            // turns relative paths to absolute, based on playlist file containing folder
            path = resolve(root, path)
          }
          // m3u are likely to contains carriage return
          path = path.replace('\r', '')
          const ext = extname(path).toLowerCase()
          // ignores folders, nested playlists, and unsupported audio formats
          if (tag.formats.includes(ext)) {
            playlist.trackIds.push(hash(path))
          }
        } else if (line.startsWith('#PLAYLIST:')) {
          playlist.name = line.replace('#PLAYLIST:', '').trim()
        }
      }
      return playlist.trackIds.length ? playlist : null
    } catch (error) {
      logger.warn({ error, path }, `failed to read playlist`)
      return null
    }
  },

  /**
   * Writes a playlist file in m3u or m3u8 format with relative path (based on given path)
   * If a relative path starts with a folder which first character is '#', use absolute path
   * @async
   * @param {string} path                       - path of the file to write
   * @param {PlaylistModel} playlist            - playlist to serialize, containing
   * @param {array<TrackModel>} playlist.tracks   - array of track models
   */
  async write(path, playlist) {
    if (playlist.tracks.length) {
      const isM3u = extname(path).toLowerCase() === '.m3u'
      await fs.ensureFile(path)
      const root = dirname(path)
      const content = ['#EXTM3U', `#PLAYLIST:${playlist.name}`]
      for (const {
        path,
        tags: { title, duration }
      } of playlist.tracks) {
        const relativePath = relative(root, path)
        content.push(
          `#EXTINF:${Math.round(duration || 0)},${title}`,
          relativePath.startsWith('#') ? path : relativePath
        )
      }
      await fs.writeFile(path, content.join(isM3u ? '\r\n' : '\n'), {
        encoding: isM3u ? 'latin1' : 'utf8'
      })
    }
  }
}
