'use strict'

const Model = require('./abstract-model')

class SettingsModel extends Model {
  constructor() {
    super({
      name: 'settings',
      jsonColumns: ['folders', 'providers', 'enqueueBehaviour']
    })
  }

  get ID() {
    return 1000
  }

  async get() {
    return this.getById(this.ID)
  }

  async save(data) {
    await super.save(data)
    return this.get()
  }
}

SettingsModel

exports.settingsModel = new SettingsModel()
