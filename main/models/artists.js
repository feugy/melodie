'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRef } = require('../utils')

class ArtistsModel extends TrackList {
  constructor() {
    super('artists', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
    })
    this.searchCol = 'name'
  }

  async computeRefs(trx, trackIds) {
    const refs = await trx(tracksModel.name)
      .whereIn('id', trackIds)
      .select('albumRef')
    return uniqRef(
      refs.reduce((all, { albumRef }) => [...all, parseRawRef(albumRef)], [])
    )
  }
}

exports.artistsModel = new ArtistsModel()
