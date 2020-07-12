'use strict'

const Model = require('./abstract-model')

class AlbumsModel extends Model {
  constructor() {
    super('albums', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.json('trackIds')
    })
    this.jsonColumns = ['trackIds']
  }
}

exports.albumsModel = new AlbumsModel()
