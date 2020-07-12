'use strict'

const Model = require('./abstract-model')

class ArtistsModel extends Model {
  constructor() {
    super('artists', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.json('trackIds')
    })
    this.jsonColumns = ['trackIds']
  }
}

exports.artistsModel = new ArtistsModel()
