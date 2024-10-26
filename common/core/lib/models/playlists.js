import { parseRawRef, parseRawRefArray, uniqRef } from '../utils/index.js'
import TrackList from './abstract-track-list.js'
import { tracksModel } from './tracks.js'

/**
 * @class PlaylistModel
 * Manager for Playlist models. Search is not supported yet.
 * Playlist do not merge their tracks, and can have duplicates
 * Has references to albums and artists.
 *
 * Model properties:
 * - {number} id                  - primary key (integer)
 * - {string} name                - playlist's name
 * - {string|null} desc           - playlist's description
 * - {string|null} media          - full path to the media file for this playlist
 * - {number} mediaCount          - count incremented on every media change
 * - {array<number>} trackIds     - ordered ids of the playlist tracks
 * - {array<Reference>} refs      - references to the track's artists
 * - {number|null} processedEpoch - epoch of the last automatic media retrieval
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

export const playlistsModel = new PlaylistModel()
