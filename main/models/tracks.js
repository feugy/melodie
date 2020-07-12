'use strict'

const Model = require('./abstract-model')

class TracksModel extends Model {
  constructor() {
    super('tracks', table => {
      table.integer('id').primary()
      table.string('path')
      table.string('media')
      table.json('tags')
      table.integer('albumId').references('albums.id')
    })
    this.jsonColumns = ['tags']
  }
}

exports.tracksModel = new TracksModel()
