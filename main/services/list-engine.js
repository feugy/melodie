'use strict'

const { of, from, concat, merge, EMPTY } = require('rxjs')
const {
  map,
  reduce,
  mergeMap,
  shareReplay,
  expand,
  filter,
  delay
} = require('rxjs/operators')
const { hash, broadcast, getLogger, uniq } = require('../utils')
const {
  albumsModel,
  tracksModel,
  artistsModel,
  settingsModel
} = require('../models')

const logger = getLogger('services/list')

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
    filter(track => track[property] || track[`prev-${property}`]),
    reduce(
      ({ recordsMap, records }, track) => {
        const name = track[property] || track[`prev-${property}`]
        const isNew = property in track
        const id = hash(name)
        let record = recordsMap.get(id)
        if (!record) {
          record = {
            id,
            name,
            media: track.media,
            trackIds: [],
            linked: []
          }
          recordsMap.set(id, record)
          records.push(record)
        }
        if (!isNew) {
          if (!record.removedTrackIds) {
            record.removedTrackIds = []
            record.removedLinked = []
          }
          record.removedTrackIds.push(track.id)
          record.removedLinked = uniq(
            record.removedLinked.concat(track.linked || [])
          )
        } else {
          record.trackIds.push(track.id)
          record.linked = uniq(record.linked.concat(track.linked || []))
        }
        return { recordsMap, records }
      },
      { recordsMap: new Map(), records: [] }
    ),
    mergeMap(({ records }) =>
      from(model.save(records)).pipe(
        mergeMap(({ saved, removedIds }) =>
          concat(
            from(saved).pipe(
              map(record => broadcast(`${property}-change`, record))
            ),
            // removals must be delays to that change are transfered before
            of(null).pipe(delay(100)),
            from(removedIds).pipe(
              map(id => broadcast(`${property}-removal`, id))
            )
          )
        )
      )
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
    logger.info(`initialize list service`)
    await settingsModel.init(dbFile)
    await albumsModel.init(dbFile)
    await artistsModel.init(dbFile)
    await tracksModel.init(dbFile)
  },

  async reset() {
    logger.info(`reset list service`)
    await tracksModel.reset()
    await artistsModel.reset()
    await albumsModel.reset()
    await settingsModel.reset()
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
        const {
          id,
          media,
          tags: { album, artists }
        } = track
        const previous = previousTags.get(id)
        const removedAlbum = difference(
          (previous && [previous.tags.album]) || [],
          [album]
        )
        const removedArtists = difference(
          (previous && previous.tags.artists) || [],
          artists || []
        )
        return merge(
          of({ id, media, album, linked: artists }),
          removedAlbum.length
            ? of({
                id,
                'prev-album': removedAlbum[0],
                linked: previous.tags.artists
              })
            : EMPTY,
          artists ? of(...artists.map(artist => ({ id, artist }))) : EMPTY,
          removedArtists.length
            ? of(
                ...removedArtists.map(artist => ({ id, 'prev-artist': artist }))
              )
            : EMPTY
        )
      }),
      shareReplay()
    )
    tracks$.pipe(...makeListPipeline('album', albumsModel)).subscribe()
    tracks$.pipe(...makeListPipeline('artist', artistsModel)).subscribe()
    await tracks$.toPromise()
  },

  async remove(trackIds) {
    const tracks$ = from(tracksModel.removeByIds(trackIds)).pipe(
      mergeMap(tracks => from(tracks)),
      expand(track => {
        if (!track.tags) {
          return EMPTY
        }
        const {
          id,
          tags: { artists, album }
        } = track
        return merge(
          of({ id, 'prev-album': album, linked: artists }),
          artists
            ? of(...artists.map(artist => ({ id, 'prev-artist': artist })))
            : EMPTY
        )
      }),
      shareReplay()
    )
    tracks$.pipe(...makeListPipeline('album', albumsModel)).subscribe()
    tracks$.pipe(...makeListPipeline('artist', artistsModel)).subscribe()
    await tracks$.toPromise()
  },

  async listAlbums(criteria) {
    logger.debug({ criteria }, `list albums`)
    return albumsModel.list({ sort: 'name', ...criteria })
  },

  async listArtists(criteria) {
    logger.debug({ criteria }, `list albums`)
    return artistsModel.list({ sort: 'name', ...criteria })
  },

  async fetchWithTracks(modelName, id, sortBy = 'trackNo') {
    logger.debug({ modelName, id, sortBy }, `fetch ${modelName} with tracks`)
    const list = await (modelName === 'artist'
      ? artistsModel
      : albumsModel
    ).getById(id)
    if (list) {
      const tracks = await tracksModel.getByIds(list.trackIds)
      list.tracks = sorters[sortBy](list, tracks)
    }
    return list
  }
}
