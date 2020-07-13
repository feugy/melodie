'use strict'

const { hash } = require('../utils')
const { albumsModel, tracksModel, artistsModel } = require('../models')

module.exports = {
  async init(dbFile) {
    await albumsModel.init(dbFile)
    await artistsModel.init(dbFile)
    await tracksModel.init(dbFile)
  },

  async reset() {
    await tracksModel.reset()
    await artistsModel.reset()
    await albumsModel.reset()
    await module.exports.init()
  },

  async add(tracks) {
    const uniqueAlbums = new Map()
    const uniqueArtists = new Map()
    for (const track of tracks) {
      await tracksModel.save(track)
      const { album, artists } = track.tags
      if (album) {
        const id = hash(album)
        let albumRecord = uniqueAlbums.get(id)
        if (!albumRecord) {
          albumRecord = {
            id,
            name: album,
            media: track.media,
            trackIds: []
          }
          uniqueAlbums.set(id, albumRecord)
        }
        albumRecord.trackIds.push(track.id)
      }
      for (const artist of artists || []) {
        const id = hash(artist)
        let artistRecord = uniqueArtists.get(id)
        if (!artistRecord) {
          artistRecord = { id, name: artist, trackIds: [] }
          uniqueArtists.set(id, artistRecord)
        }
        artistRecord.trackIds.push(track.id)
      }
    }
    // TODO pMap or save multiples
    for (const [, album] of uniqueAlbums) {
      await albumsModel.save(album)
    }
    for (const [, artist] of uniqueArtists) {
      await artistsModel.save(artist)
    }
  },

  async listAlbums() {
    return albumsModel.list()
  },

  async listArtists() {
    return artistsModel.list()
  },

  async listTracksOf(list) {
    const tracks = await tracksModel.getByIds(list.trackIds)
    return tracks.sort(
      (t1, t2) =>
        (t1.tags.track.no || Infinity) - (t2.tags.track.no || Infinity)
    )
  }
}
