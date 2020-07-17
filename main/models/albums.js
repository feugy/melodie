'use strict'

const TrackList = require('./abstract-track-list')

class AlbumsModel extends TrackList {
  constructor() {
    super('albums', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
    })
  }
}

exports.albumsModel = new AlbumsModel()
