'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRef } = require('../utils')

class ArtistsModel extends TrackList {
  constructor() {
    super({ name: 'artists', searchCol: 'name' })
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
