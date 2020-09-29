'use strict'

const { of, from, concat, merge, EMPTY, Subject } = require('rxjs')
const {
  reduce,
  mergeMap,
  shareReplay,
  expand,
  filter,
  delay,
  tap,
  bufferTime
} = require('rxjs/operators')
const { broadcast, getLogger, differenceRef } = require('../utils')
const {
  albumsModel,
  tracksModel,
  artistsModel,
  playlistsModel
} = require('../models')

const logger = getLogger('services/tracks')

const messages$ = new Subject()

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
    filter(data => data[`${property}Ref`] || data[`prev-${property}Ref`]),
    reduce(
      ({ recordsMap, records }, data) => {
        const [id, name] = data[`${property}Ref`] || data[`prev-${property}Ref`]
        const isNew = `${property}Ref` in data
        let record = recordsMap.get(id)
        if (!record) {
          record = {
            id,
            name,
            media: name ? data.media : null,
            trackIds: []
          }
          recordsMap.set(id, record)
          records.push(record)
        }
        if (!isNew) {
          if (!record.removedTrackIds) {
            record.removedTrackIds = []
          }
          record.removedTrackIds.push(data.id)
        } else {
          record.trackIds.push(data.id)
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
              tap(record =>
                messages$.next({ type: `${property}-changes`, data: record })
              )
            ),
            // removals must be delays to that change are transfered before
            of(null).pipe(delay(100)),
            from(removedIds).pipe(
              tap(id =>
                messages$.next({ type: `${property}-removals`, data: id })
              )
            )
          )
        )
      )
    )
  ]
}

let subscription

function stopListening() {
  if (subscription) {
    subscription.unsubscribe()
  }
}

module.exports = {
  listen() {
    stopListening()
    subscription = messages$
      .pipe(
        bufferTime(1000),
        filter(messages => messages.length > 0)
      )
      .subscribe(messages => {
        const types = new Map()
        for (const { type, data } of messages) {
          let messagesByType = types.get(type)
          if (!messagesByType) {
            messagesByType = []
            types.set(type, messagesByType)
          }
          messagesByType.push(data)
        }
        for (const [type, data] of types) {
          broadcast(type, data)
        }
      })
  },

  stopListening,

  async add(tracks) {
    const tracks$ = from(tracksModel.save(tracks)).pipe(
      mergeMap(from),
      tap(({ current }) =>
        messages$.next({ type: 'track-changes', data: current })
      ),
      expand(({ current, previous }) => {
        if (!current) {
          return EMPTY
        }
        const { id, media, albumRef, artistRefs } = current
        const removedAlbum = differenceRef(
          [previous && previous.albumRef],
          [albumRef]
        )
        const removedArtists = differenceRef(
          (previous && previous.artistRefs) || [],
          artistRefs
        )
        return merge(
          // adds track to new album
          of({ id, media, albumRef }),
          // removes track from old album, if any
          removedAlbum.length
            ? of({
                id,
                'prev-albumRef': removedAlbum[0]
              })
            : EMPTY,
          // adds track to new artists
          of(
            ...artistRefs.map(artistRef => ({
              id,
              artistRef
            }))
          ),
          // removes track from old artists, if any
          removedArtists.length
            ? of(
                ...removedArtists.map(ref => ({
                  id,
                  'prev-artistRef': ref
                }))
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
      mergeMap(from),
      tap(track => messages$.next({ type: 'track-removals', data: track.id })),
      expand(({ id, albumRef, artistRefs }) => {
        if (!artistRefs) {
          return EMPTY
        }
        return merge(
          of({ id, 'prev-albumRef': albumRef }),
          of(...artistRefs.map(ref => ({ id, 'prev-artistRef': ref })))
        )
      }),
      filter(data => !data.tags),
      shareReplay()
    )
    tracks$.pipe(...makeListPipeline('album', albumsModel)).subscribe()
    tracks$.pipe(...makeListPipeline('artist', artistsModel)).subscribe()
    await tracks$.toPromise()
  },

  async list(modelName, criteria) {
    logger.debug({ modelName, criteria }, `list ${modelName}s`)
    return (modelName === 'artist'
      ? artistsModel
      : modelName === 'album'
      ? albumsModel
      : playlistsModel
    ).list({ sort: 'name', ...criteria })
  },

  async fetchWithTracks(modelName, id, sortBy = 'trackNo') {
    logger.debug({ modelName, id, sortBy }, `fetch ${modelName} with tracks`)
    const list = await (modelName === 'artist'
      ? artistsModel
      : modelName === 'album'
      ? albumsModel
      : playlistsModel
    ).getById(id)
    if (list) {
      const tracks = await tracksModel.getByIds(list.trackIds)
      list.tracks = sorters[sortBy](list, tracks)
    }
    return list
  },

  async search(searched, { size, from } = {}) {
    logger.debug({ searched }, `search for "${searched}"`)
    const [albums, artists, tracks] = await Promise.all([
      albumsModel.list({ size, from, searched }),
      artistsModel.list({ size, from, searched }),
      tracksModel.list({ size, from, searched })
    ])
    const totals = {
      albums: albums.total,
      artists: artists.total,
      tracks: tracks.total
    }
    logger.debug(
      {
        totals,
        searched
      },
      `search results for "${searched}"`
    )
    return {
      totalSum: totals.albums + totals.artists + totals.tracks,
      size: albums.size,
      from: albums.from,
      totals,
      albums: albums.results,
      artists: artists.results,
      tracks: tracks.results
    }
  }
}
