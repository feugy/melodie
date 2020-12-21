'use strict'

const { settingsModel } = require('../models')
const {
  broadcast,
  getLogger,
  mergePaths,
  getSystemLocale
} = require('../utils')
const { local, audiodb, discogs, allProviders } = require('../providers')

const logger = getLogger('services/settings')

module.exports = {
  /**
   * Returns settings, guessing locale if not set
   * @async
   * @returns {SettingsModel} current settings
   */
  async get() {
    const settings = await settingsModel.get()
    if (!settings.locale) {
      settings.locale = await getSystemLocale()
    }
    return settings
  },

  /**
   * Initialize the settings service:
   * - increments the number of times the application was opened
   * - initializes AudioDB & Discogs providers with keys and tokens
   * - triggers track comparison on all providers
   * @async
   */
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

  /**
   * Monitors new folders, importing their tracks.
   * Broadcasts `watching-folders` message when new folders are fully imported
   * @async
   * @param {array<string>} folders - list of added folders.
   * @param {function} importDone   - optional callback invoked when track import is over
   * @returns {SettingsModel} updated settings
   */
  async addFolders(folders, importDone = () => {}) {
    logger.info({ folders }, `adding new folders...`)
    const settings = await this.get()
    const { merged, added } = mergePaths(folders, settings.folders)
    if (!added.length) {
      return settings
    }
    const saved = await settingsModel.save({
      ...settings,
      folders: merged
    })
    local.importTracks(added).then(imported => {
      broadcast('watching-folders', added)
      importDone(imported)
    })
    return saved
  },

  /**
   * Removes a folder from the list of monitored folders.
   * @async
   * @param {string} folder - removed folder.
   * @returns {SettingsModel} updated settings
   */
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

  /**
   * Change locale in settings
   * @async
   * @param {string} value - new locale
   * @returns {SettingsModel} updated settings
   */
  async setLocale(value) {
    const settings = await this.get()
    logger.debug({ value }, 'saving new locale value')
    return settingsModel.save({
      ...settings,
      locale: value
    })
  },

  /**
   * Change AudioDB provider's key in settings, and initializes the provider.
   * @async
   * @param {string} key - new key
   * @returns {SettingsModel} updated settings
   */
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

  /**
   * Change Discogs provider's key in settings, and initializes the provider.
   * @async
   * @param {string} key - new key
   * @returns {SettingsModel} updated settings
   */
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

  /**
   * Change the UI behaviour when enqueing tracks.
   * @async
   * @param {object} behaviour            - new behaviour, including:
   * @param {boolean} behaviour.clearBefore - whether the tracks queue should be cleared when adding and immediately playing new tracks
   * @param {boolean} behaviour.onClick     - whether playing immediately or enqueuing tracks on simple click
   * @returns {SettingsModel} updated settings
   */
  async setEnqueueBehaviour({ clearBefore, onClick }) {
    const settings = await this.get()
    logger.debug({ clearBefore, onClick }, 'saving enqueue behaviour')
    return settingsModel.save({
      ...settings,
      enqueueBehaviour: { clearBefore, onClick }
    })
  }
}
