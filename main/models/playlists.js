'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRef, parseRawRefArray } = require('../utils')

class PlaylistModel extends TrackList {
  constructor() {
    super('playlists', table => {
      table.integer('id').primary()
      table.string('name')
      table.text('desc')
      table.string('media')
    })
    // TODO search on name & desc as well
    this.searchCol = 'refs'
  }

  async computeRefs(trx, trackIds) {
    const refs = await trx(tracksModel.name)
      .whereIn('id', trackIds)
      .select('albumRef', 'artistRefs')
    return uniqRef(
      refs.reduce(
        (all, { artistRefs, albumRef }) =>
          all.concat(parseRawRefArray(artistRefs), [parseRawRef(albumRef)]),
        []
      )
    )
  }
}

exports.playlistsModel = new PlaylistModel()
