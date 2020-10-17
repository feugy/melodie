'use strict'

const Model = require('./abstract-model')

/**
 * @class SettingsModel
 * Manager for Settings. There must only be a single model of settings.
 */
class SettingsModel extends Model {
  constructor() {
    super({
      name: 'settings',
      jsonColumns: ['folders', 'providers', 'enqueueBehaviour']
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
   * Saves the singleton model
   * @async
   * @param {object} data - new settings
   * @returns {SettingsModel} saved settings
   */
  async save(data) {
    await super.save(data)
    return this.get()
  }
}

SettingsModel

exports.settingsModel = new SettingsModel()
