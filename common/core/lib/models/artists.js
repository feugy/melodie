import { parseRawRef, uniqRef } from '../utils/index.js'
import TrackList from './abstract-track-list.js'
import { tracksModel } from './tracks.js'

/**
 * @class ArtistsModel
 * Manager for Artist models. The seached column is name.
 * Has references to albums.
 *
 * Model properties:
 * - {number} id                  - primary key (integer)
 * - {string} name                - artist's name
 * - {object|null} bio            - artist's bio (each key is a language code)
 * - {string|null} media          - full path to the artwork file for this artist
 * - {number} mediaCount          - count incremented on every media change
 * - {array<number>} trackIds     - ids of the artist's tracks
 * - {array<Reference>} refs      - references to the artist's albums
 * - {number|null} processedEpoch - epoch of the last automatic media retrieval
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

export const artistsModel = new ArtistsModel()
