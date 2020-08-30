'use strict'

const { of, from, concat, merge, EMPTY } = require('rxjs')
const {
  reduce,
  mergeMap,
  shareReplay,
  expand,
  filter,
  delay,
  tap
} = require('rxjs/operators')
const { broadcast, getLogger, differenceRef } = require('../utils')
const {
  albumsModel,
  tracksModel,
  artistsModel,
  settingsModel,
  playlistsModel
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
              tap(record => broadcast(`${property}-change`, record))
            ),
            // removals must be delays to that change are transfered before
            of(null).pipe(delay(100)),
            from(removedIds).pipe(
              tap(id => broadcast(`${property}-removal`, id))
            )
          )
        )
      )
    )
  ]
}

module.exports = {
  async init(dbFile) {
    logger.info(`initialize list service`)
    await settingsModel.init(dbFile)
    await albumsModel.init(dbFile)
    await artistsModel.init(dbFile)
    await tracksModel.init(dbFile)
    await playlistsModel.init(dbFile)
  },

  async reset() {
    logger.info(`reset list service`)
    await tracksModel.reset()
    await artistsModel.reset()
    await albumsModel.reset()
    await settingsModel.reset()
    await playlistsModel.reset()
    await module.exports.init()
  },

  async add(tracks) {
    const tracks$ = from(tracksModel.save(tracks)).pipe(
      mergeMap(from),
      tap(({ current }) => broadcast('track-change', current)),
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
      tap(track => broadcast('track-removal', track.id)),
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

  async listAlbums(criteria) {
    logger.debug({ criteria }, `list albums`)
    return albumsModel.list({ sort: 'name', ...criteria })
  },

  async listArtists(criteria) {
    logger.debug({ criteria }, `list albums`)
    return artistsModel.list({ sort: 'name', ...criteria })
  },

  async listPlaylists(criteria) {
    logger.debug({ criteria }, `list playlist`)
    return playlistsModel.list({ sort: 'name', ...criteria })
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
