'use strict'

const { dialog } = require('electron')
const { services } = require('@melodie/core')

module.exports = {
  ...services.playlists,

  /**
   * Exports a given playlist into a playlist file: opens system explorer so users could select a file,
   * then serialize the playlist in it.
   * @async
   * @param {number} id - the serialized playlist id
   * @returns {string|null} the written file path
   * @see @melodie/core/services/playlists.exports()
   */
  async export(id) {
    return services.playlists.export(
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
}
