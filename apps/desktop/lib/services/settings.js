import { services, utils } from '@melodie/core'
import { dialog } from 'electron'

export * from '@melodie/core/lib/services/settings.js'

/**
 * Opens a dialog to select folders and starts monitoring them.
 * @async
 * @returns {SettingsModel|null} updated settings
 * @see @melodie/core/services/settings.addFolders()
 */
export async function addFolders(folders) {
  utils.getLogger('services/settings').debug('picking new folders')
  folders = (
    await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
  ).filePaths
  return folders.length ? await services.settings.addFolders(folders) : null
}
