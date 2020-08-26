'use strict'

const Model = require('./abstract-model')

class SettingsModel extends Model {
  constructor() {
    super('settings', table => {
      table.integer('id').primary()
      table.json('folders')
      table.string('locale')
    })
    this.jsonColumns = ['folders']
  }

  get ID() {
    return 1000
  }

  async init(...args) {
    await super.init(...args)
    const existing = await this.getById(this.ID)
    if (!existing) {
      this.logger.debug('creating settings singleton')
      await this.save({ id: this.ID, folders: [] })
    }
  }

  async get() {
    return this.getById(this.ID)
  }
}

SettingsModel

exports.settingsModel = new SettingsModel()
