'use strict'

const { dialog } = require('electron')
const { settingsModel } = require('../models')
const { getLogger, mergeFolders, getSystemLocale } = require('../utils')
const { local, audiodb, discogs, allProviders } = require('../providers')

const logger = getLogger('services/settings')

module.exports = {
  async get() {
    const settings = await settingsModel.get()
    if (!settings.locale) {
      settings.locale = await getSystemLocale()
    }
    return settings
  },

  async init() {
    const settings = await this.get()
    await settingsModel.save({
      ...settings,
      openCount: settings.openCount + 1
    })
    logger.info('initializing providers')
    audiodb.init(settings.providers.audiodb)
    discogs.init(settings.providers.discogs)
    logger.info('comparing provider tracks')
    for (const provider of allProviders) {
      provider.compareTracks()
    }
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
    const saved = await settingsModel.save({
      ...settings,
      folders: merged
    })
    local.importTracks()
    return saved
  },

  async removeFolder(folder) {
    let settings = await this.get()
    const { folders } = settings
    logger.debug({ folder, folders }, 'remove watched folders from the list')
    let idx = folders.indexOf(folder)
    if (idx >= 0) {
      folders.splice(idx, 1)
      settings = await settingsModel.save(settings)
      local.importTracks()
    }
    return settings
  },

  async setLocale(value) {
    const settings = await this.get()
    logger.debug({ value }, 'saving new locale value')
    return settingsModel.save({
      ...settings,
      locale: value
    })
  },

  async setAudioDBKey(key) {
    const settings = await this.get()
    const conf = { key }
    logger.debug(conf, 'saving new key for AudioDB provider')
    const saved = await settingsModel.save({
      ...settings,
      providers: { ...settings.providers, audiodb: conf }
    })
    audiodb.init(conf)
    return saved
  },

  async setDiscogsToken(token) {
    const settings = await this.get()
    const conf = { token }
    logger.debug(conf, 'saving new token for Discogs provider')
    const saved = await settingsModel.save({
      ...settings,
      providers: { ...settings.providers, discogs: conf }
    })
    discogs.init(conf)
    return saved
  },

  async setEnqueueBehaviour({ clearBefore, onClick }) {
    const settings = await this.get()
    logger.debug({ clearBefore, onClick }, 'saving enqueue behaviour')
    return settingsModel.save({
      ...settings,
      enqueueBehaviour: { clearBefore, onClick }
    })
  }
}
