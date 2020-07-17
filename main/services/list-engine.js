'use strict'

const { hash, broadcast } = require('../utils')
const { albumsModel, tracksModel, artistsModel } = require('../models')

const sorters = {
  trackNo: (list, results) =>
    results.sort((t1, t2) =>
      t1.tags.disk.no !== t2.tags.disk.no
        ? (t1.tags.disk.no || Infinity) - (t2.tags.disk.no || Infinity)
        : (t1.tags.track.no || Infinity) - (t2.tags.track.no || Infinity)
    ),
  rank: (list, results) =>
    list.trackIds.map(id => results.find(track => track.id === id))
}

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
    // TODO rewrite with rx
    const uniqueAlbums = new Map()
    const uniqueAlbumList = []
    const uniqueArtists = new Map()
    const uniqueArtistList = []
    await tracksModel.save(tracks)
    for (const track of tracks) {
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
          uniqueAlbumList.push(albumRecord)
        }
        albumRecord.trackIds.push(track.id)
      }
      for (const artist of artists || []) {
        const id = hash(artist)
        let artistRecord = uniqueArtists.get(id)
        if (!artistRecord) {
          artistRecord = { id, name: artist, trackIds: [] }
          uniqueArtists.set(id, artistRecord)
          uniqueArtistList.push(artistRecord)
        }
        artistRecord.trackIds.push(track.id)
      }
    }

    for (const album of uniqueAlbumList) {
      broadcast('album-change', album)
    }
    await albumsModel.save(uniqueAlbumList)
    for (const artist of uniqueArtistList) {
      broadcast('artist-change', artist)
    }
    await artistsModel.save(uniqueArtistList)
  },

  async listAlbums(criteria) {
    return albumsModel.list({ sort: 'name', ...criteria })
  },

  async listArtists(criteria) {
    return artistsModel.list({ sort: 'name', ...criteria })
  },

  async listTracksOf(list, sortBy = 'trackNo') {
    const tracks = await tracksModel.getByIds(list.trackIds)
    return sorters[sortBy](list, tracks)
  }
}
