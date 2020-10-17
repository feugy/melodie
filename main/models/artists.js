'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRef } = require('../utils')

/**
 * @class ArtistsModel
 * Manager for Artist models. The seached column is name.
 * Has references to albums.
 */
class ArtistsModel extends TrackList {
  constructor() {
    super({ name: 'artists', searchCol: 'name', jsonColumns: ['bio'] })
  }

  /**
   * Computes references to albums from the contained tracks.
   * @async
   * @param {Transaction} trx - the Knex transation
   * @returns {array<Reference>} a list (possibly empty) of album references
   */
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
