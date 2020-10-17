'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRef, parseRawRefArray } = require('../utils')

/**
 * @class PlaylistModel
 * Manager for Playlist models. Search is not supported yet.
 * Playlist do not merge their tracks, and can have duplicates
 * Has references to albums and artists.
 */
class PlaylistModel extends TrackList {
  constructor() {
    // TODO search on name & desc as well
    super({ name: 'playlists', searchCol: 'refs', mergeTrackIds: false })
  }

  /**
   * Computes references to albums and artists from the contained tracks.
   * @async
   * @param {Transaction} trx - the Knex transation
   * @returns {array<Reference>} a list (possibly empty) of album and artist references
   */
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
