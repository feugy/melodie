'use strict'

const { of, from, forkJoin, merge, EMPTY } = require('rxjs')
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

function makeListPipeline(property, model) {
  return [
    filter(track => track[property] || track[`previous-${property}`]),
    reduce(
      ({ recordsMap, records }, track) => {
        const name = track[property] || track[`previous-${property}`]
        const isNew = property in track
        const id = hash(name)
        let record = recordsMap.get(id)
        if (!record) {
          record = {
            id,
            name,
            media: track.media,
            trackIds: []
          }
          recordsMap.set(id, record)
          records.push(record)
        }
        if (!isNew) {
          if (!record.removedTrackIds) {
            record.removedTrackIds = []
          }
          record.removedTrackIds.push(track.id)
        } else {
          record.trackIds.push(track.id)
        }
        return { recordsMap, records }
      },
      { recordsMap: new Map(), records: [] }
    ),
    mergeMap(({ records }) =>
      forkJoin([
        from(model.save(records)),
        from(records).pipe(
          map(record => broadcast(`${property}-change`, record))
        )
      ])
    )
  ]
}

function difference(original, compared) {
  const originalIds = original.map(hash)
  const comparedIds = compared.map(hash)
  const result = []
  for (let i = 0; i < originalIds.length; i++) {
    if (!comparedIds.includes(originalIds[i])) {
      result.push(original[i])
    }
  }
  return result
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
    const previousTags = (
      await from(tracksModel.save(tracks)).toPromise()
    ).reduce((map, previous) => map.set(previous.id, previous), new Map())

    const tracks$ = from(tracks).pipe(
      expand(track => {
        if (!track.tags) {
          return EMPTY
        }
        const id = track.id
        const previous = previousTags.get(id)
        const removedArtists = difference(
          (previous && previous.tags.artists) || [],
          track.tags.artists || []
        )
        const removedAlbum = difference(
          (previous && [previous.tags.album]) || [],
          [track.tags.album]
        )
        return merge(
          of({ id, media: track.media, album: track.tags.album }),
          removedAlbum.length
            ? of({ id, 'previous-album': removedAlbum[0] })
            : EMPTY,
          track.tags.artists
            ? of(...track.tags.artists.map(artist => ({ id, artist })))
            : EMPTY,
          removedArtists.length
            ? of(
                ...removedArtists.map(artist => ({
                  id,
                  'previous-artist': artist
                }))
              )
            : EMPTY
        )
      }),
      shareReplay()
    )
    tracks$.pipe(...makeListPipeline('album', albumsModel)).subscribe()
    tracks$.pipe(...makeListPipeline('artist', artistsModel)).subscribe()
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
