import { publicIpv4 } from 'public-ip'

import { settingsModel } from '../models/index.js'
import { audiodb, discogs, local } from '../providers/index.js'
import {
  broadcast,
  getLogger,
  getSystemLocale,
  mergePaths
} from '../utils/index.js'

const logger = getLogger('services/settings')

let serverPort = null

/**
 * Returns settings, guessing locale if not set
 * @async
 * @returns {SettingsModel} current settings
 */
export async function get() {
  const settings = await settingsModel.get()
  if (!settings.locale) {
    settings.locale = await getSystemLocale()
  }
  return settings
}

/**
 * Returns the public address hosting the UI
 * @returns {string} UI public url, or null when network is unreachable
 */
export async function getUIAddress() {
  try {
    return `http://${await publicIpv4({ timeout: 500 })}:${serverPort}`
  } catch (err) {
    logger.error({ err }, 'failed to read public ip')
  }
  return null
}

/**
 * Initialize the settings service:
 * - increments the number of times the application was opened
 * - initializes AudioDB & Discogs providers with keys and tokens
 * - triggers track comparison on all providers
 * @async
 * @param {number} port - port our server is listening to
 * @returns {SettingsModel} updated settings
 */
export async function init(port) {
  serverPort = port
  const settings = await this.get()
  await settingsModel.save({
    ...settings,
    openCount: settings.openCount + 1
  })
  logger.info('initializing providers')
  audiodb.init(settings.providers.audiodb)
  discogs.init(settings.providers.discogs)
  return settings
}

/**
 * Monitors new folders, importing their tracks.
 * Broadcasts `watching-folders` message when new folders are fully imported
 * @async
 * @param {array<string>} folders - list of added folders.
 * @param {function} importDone   - optional callback invoked when track import is over
 * @returns {SettingsModel} updated settings
 */
export async function addFolders(folders, importDone = () => {}) {
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
}

/**
 * Removes a folder from the list of monitored folders.
 * @async
 * @param {string} folder - removed folder.
 * @returns {SettingsModel} updated settings
 */
export async function removeFolder(folder) {
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
}

/**
 * Changes locale in settings
 * @async
 * @param {string} value - new locale
 * @returns {SettingsModel} updated settings
 */
export async function setLocale(value) {
  const settings = await this.get()
  logger.debug({ value }, 'saving new locale value')
  return settingsModel.save({
    ...settings,
    locale: value
  })
}

/**
 * Changes AudioDB provider's key in settings, and initializes the provider.
 * @async
 * @param {string} key - new key
 * @returns {SettingsModel} updated settings
 */
export async function setAudioDBKey(key) {
  const settings = await this.get()
  const conf = { key }
  logger.debug(conf, 'saving new key for AudioDB provider')
  const saved = await settingsModel.save({
    ...settings,
    providers: { ...settings.providers, audiodb: conf }
  })
  audiodb.init(conf)
  return saved
}

/**
 * Changes Discogs provider's key in settings, and initializes the provider.
 * @async
 * @param {string} key - new key
 * @returns {SettingsModel} updated settings
 */
export async function setDiscogsToken(token) {
  const settings = await this.get()
  const conf = { token }
  logger.debug(conf, 'saving new token for Discogs provider')
  const saved = await settingsModel.save({
    ...settings,
    providers: { ...settings.providers, discogs: conf }
  })
  discogs.init(conf)
  return saved
}

/**
 * Changes the UI behaviour when enqueing tracks.
 * @async
 * @param {object} behaviour            - new behaviour, including:
 * @param {boolean} behaviour.clearBefore - whether the tracks queue should be cleared when adding and immediately playing new tracks
 * @param {boolean} behaviour.onClick     - whether playing immediately or enqueuing tracks on simple click
 * @returns {SettingsModel} updated settings
 */
export async function setEnqueueBehaviour({ clearBefore, onClick }) {
  const settings = await this.get()
  logger.debug({ clearBefore, onClick }, 'saving enqueue behaviour')
  return settingsModel.save({
    ...settings,
    enqueueBehaviour: { clearBefore, onClick }
  })
}

/**
 * Sets or unsets broadcasting.
 * @async
 * @returns {SettingsModel} updated settings
 */
export async function toggleBroadcast() {
  const settings = await this.get()
  const { isBroadcasting } = settings
  logger.info(
    { previous: isBroadcasting },
    `${isBroadcasting ? 'stops' : 'starts'} broadcasting`
  )
  return settingsModel.save({ ...settings, isBroadcasting: !isBroadcasting })
}

/**
 * Sets broadcast port
 * @async
 * @param {number} port - new port for broadcast. Can be null
 * @returns {SettingsModel} updated settings
 */
export async function setBroadcastPort(port) {
  const settings = await this.get()
  logger.info(
    { previous: settings.setBroadcastPort, port },
    `new broadcast port: ${port}`
  )
  return settingsModel.save({ ...settings, broadcastPort: port })
}
