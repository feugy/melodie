'use strict'

const Model = require('./abstract-model')
const { broadcast } = require('../utils')

/**
 * @class SettingsModel
 * Manager for Settings. There must only be a single model of settings.
 * Model properties:
 * - {number} id                - primary key (integer)
 * - {array<string>} folders    - list of monitored folders
 * - {object} providers         - providers settings: each property is the provider name
 * - {string} locale            - current locale used
 * - {number} openCount         - how many times Mélodie was opened (positive integer)
 * - {object} enqueueBehaviour  - `clearBefore` & `onClick` booleans to control how tracks are enqueued
 * - {boolean} isBroadcasting   - true when the UI is served over the broadcast port
 * - {number} broadcastPort     - broadcast port set by user (optional)
 */
class SettingsModel extends Model {
  constructor() {
    super({
      name: 'settings',
      jsonColumns: [
        'folders',
        'providers',
        'enqueueBehaviour',
        'isBroadcasting'
      ]
    })
  }

  /**
   * @type {number} Id of the singleton model
   */
  get ID() {
    return 1000
  }

  /**
   * Returns the singleton model
   * @async
   * @returns {SettingsModel} settings
   */
  async get() {
    return this.getById(this.ID)
  }

  /**
   * Saves the singleton model and broadcasts "settings-saved" event with saved settings
   * @async
   * @param {object} data - new settings
   * @returns {SettingsModel} saved settings
   */
  async save(data) {
    await super.save(data)
    const saved = await this.get()
    broadcast('settings-saved', saved)
    return saved
  }
}

SettingsModel

exports.settingsModel = new SettingsModel()
