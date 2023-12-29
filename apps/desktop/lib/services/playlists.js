import { services } from '@melodie/core'
import { dialog } from 'electron'

export * from '@melodie/core/lib/services/playlists.js'

/**
 * Exports a given playlist into a playlist file: opens system explorer so users could select a file,
 * then serialize the playlist in it.
 * @async
 * @param {number} id - the serialized playlist id
 * @returns {string|null} the written file path
 * @see @melodie/core/services/playlists.exports()
 */
export async function exportPlaylist(id) {
  return services.playlists.exportPlaylist(
    id,
    async (playlist, formats) =>
      (
        await dialog.showSaveDialog({
          defaultPath: `${playlist.name}.m3u8`,
          filters: [{ extensions: formats }],
          properties: ['createDirectory']
        })
      ).filePath
  )
}
