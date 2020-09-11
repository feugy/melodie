'use strict'

const Model = require('./abstract-model')

class SettingsModel extends Model {
  constructor() {
    super({ name: 'settings', jsonColumns: ['folders'] })
  }

  get ID() {
    return 1000
  }

  async get() {
    return this.getById(this.ID)
  }
}

SettingsModel

exports.settingsModel = new SettingsModel()
