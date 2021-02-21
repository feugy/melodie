'use strict'

const { dialog } = require('electron')
const {
  services,
  utils: { getLogger }
} = require('@melodie/core')

module.exports = {
  ...services.settings,

  /**
   * Opens a dialog to select folders and starts monitoring them.
   * @async
   * @returns {SettingsModel|null} updated settings
   * @see @melodie/core/services/settings.addFolders()
   */
  async addFolders(folders) {
    getLogger('services/settings').debug('picking new folders')
    folders = (
      await dialog.showOpenDialog({
        properties: ['openDirectory', 'multiSelections']
      })
    ).filePaths
    return folders.length ? services.settings.addFolders(folders) : null
  }
}
