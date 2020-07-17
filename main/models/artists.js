'use strict'

const TrackList = require('./abstract-track-list')

class ArtistsModel extends TrackList {
  constructor() {
    super('artists', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
    })
  }
}

exports.artistsModel = new ArtistsModel()
