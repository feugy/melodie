'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRef, parseRawRefArray } = require('../utils')

class PlaylistModel extends TrackList {
  constructor() {
    // TODO search on name & desc as well
    super({ name: 'playlists', searchCol: 'refs', mergeTrackIds: false })
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
