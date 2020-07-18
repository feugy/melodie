'use strict'

const { from, forkJoin, merge, EMPTY } = require('rxjs')
const {
  map,
  reduce,
  mergeMap,
  shareReplay,
  expand,
  filter
} = require('rxjs/operators')
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

const makeListPipeline = function (property, model, updatedRecords) {
  return [
    filter(track => track.tags[property]),
    reduce(
      ({ recordsMap, records }, track) => {
        const name = track.tags[property]
        const id = hash(name)
        let record = recordsMap.get(id)
        if (!record) {
          const updatedAlbum = updatedRecords.get(id) || {}
          updatedRecords.delete(id)
          record = {
            id,
            name,
            media: track.media || null,
            trackIds: [],
            ...updatedAlbum
          }
          recordsMap.set(id, record)
          records.push(record)
        }
        record.trackIds.push(track.id)
        return { recordsMap, records }
      },
      { recordsMap: new Map(), records: [] }
    ),
    map(({ records }) => records.concat([...updatedRecords.values()])),
    mergeMap(records =>
      forkJoin([
        from(model.save(records)),
        from(records).pipe(
          map(record => broadcast(`${property}-change`, record))
        )
      ])
    )
  ]
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
    const previousTags = await from(tracksModel.save(tracks)).toPromise()
    const updatedAlbums = new Map()
    const updatedArtists = new Map()
    for (const track of tracks) {
      const previous = previousTags.find(({ id }) => id === track.id)
      if (previous) {
        if (previous.tags.album) {
          const id = hash(previous.tags.album)
          if (!track.tags.album || id !== hash(track.tags.album)) {
            let updatedAlbum = updatedAlbums.get(id)
            if (!updatedAlbum) {
              updatedAlbum = { id, removedTrackIds: [] }
              updatedAlbums.set(id, updatedAlbum)
            }
            updatedAlbum.removedTrackIds.push(track.id)
          }
        }
        const currentArtistIds = (track.tags.artists || []).map(hash)
        for (const artist of previous.tags.artists || []) {
          const id = hash(artist)
          if (!currentArtistIds.includes(id)) {
            let updatedArtist = updatedArtists.get(id)
            if (!updatedArtist) {
              updatedArtist = { id, removedTrackIds: [] }
              updatedArtists.set(id, updatedArtist)
            }
            updatedArtist.removedTrackIds.push(track.id)
          }
        }
      }
    }
    const tracks$ = from(tracks).pipe(
      expand(track =>
        merge(
          from(
            track.tags.artists
              ? track.tags.artists.map(artist => ({
                  id: track.id,
                  tags: { artist }
                }))
              : EMPTY
          ),
          from(
            track.tags.genres
              ? track.tags.genres.map(genre => ({
                  id: track.id,
                  tags: { genre }
                }))
              : EMPTY
          )
        )
      ),
      shareReplay()
    )
    tracks$
      .pipe(...makeListPipeline('album', albumsModel, updatedAlbums))
      .subscribe()
    tracks$
      .pipe(...makeListPipeline('artist', artistsModel, updatedArtists))
      .subscribe()
    // TODO tracks$.pipe(...makeListPipeline('genre', genresModel)).subscribe()
    await tracks$.toPromise()
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
