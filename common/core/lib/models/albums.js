'use strict'

const TrackList = require('./abstract-track-list')
const { tracksModel } = require('./tracks')
const { uniqRef, parseRawRefArray } = require('../utils')

/**
 * @class AlbumsModel
 * Manager for Album models. The seached column is name.
 * Has references to artists.
 *
 * Model properties:
 * - {number} id                  - primary key (integer)
 * - {string} name                - album's name
 * - {string|null} media          - full path to the cover file for this album
 * - {array<number>} trackIds     - ids of the album's tracks
 * - {array<Reference>} refs      - references to the album's artists
 * - {number|null} processedEpoch - epoch of the last automatic media retrieval
 */
class AlbumsModel extends TrackList {
  constructor() {
    super({ name: 'albums', searchCol: 'name' })
  }

  /**
   * Returns models by their album name (does not consider case).
   * @async
   * @param {string} name - searched name
   * @returns {array<AlbumsModel>} a list (possibly empty) of matching albums
   */
  async getByName(name) {
    const results = (
      await this.db
        .whereRaw('name = ? collate nocase', name)
        .select()
        .from(this.name)
    ).map(this.makeDeserializer())
    this.logger.debug({ name, hitCount: results.length }, 'fetch by name')
    return results
  }

  /**
   * Computes references to artists from the contained tracks.
   * @async
   * @param {Transaction} trx - the Knex transation
   * @returns {array<Reference>} a list (possibly empty) of artist references
   */
  async computeRefs(trx, trackIds) {
    const refs = await trx(tracksModel.name)
      .whereIn('id', trackIds)
      .select('artistRefs')
    return uniqRef(
      refs.reduce(
        (all, { artistRefs }) => all.concat(parseRawRefArray(artistRefs)),
        []
      )
    )
  }
}

exports.albumsModel = new AlbumsModel()
