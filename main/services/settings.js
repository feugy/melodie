'use strict'

const { dialog } = require('electron')
const { settingsModel } = require('../models')
const { getLogger, mergeFolders, getSystemLocale } = require('../utils')
const localProvider = require('../providers/local')

const logger = getLogger('services/settings')

module.exports = {
  async get() {
    const settings = await settingsModel.get()
    if (!settings.locale) {
      settings.locale = await getSystemLocale()
    }
    return settings
  },

  async recordOpening() {
    const settings = await this.get()
    await settingsModel.save({
      ...settings,
      openCount: settings.openCount + 1
    })
  },

  async addFolders() {
    logger.debug('picking new folders')
    const { filePaths: folders } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'multiSelections']
    })
    if (!folders.length) {
      return null
    }
    logger.info({ folders }, `adding new folders...`)
    const settings = await this.get()
    const merged = mergeFolders(folders, settings.folders)
    await settingsModel.save({
      ...settings,
      folders: merged
    })
    localProvider.importTracks()
    return merged
  },

  async removeFolder(folder) {
    const settings = await this.get()
    const { folders } = settings
    logger.debug({ folder, folders }, 'remove watched folders from the list')
    let idx = folders.indexOf(folder)
    if (idx >= 0) {
      folders.splice(idx, 1)
      await settingsModel.save(settings)
      localProvider.importTracks()
    }
  },

  async setLocale(value) {
    const settings = await this.get()
    logger.debug({ value }, 'saving new locale value')
    await settingsModel.save({
      ...settings,
      locale: value
    })
  }
}
