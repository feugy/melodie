'use strict'

const { resolve } = require('path')
const { concat, EMPTY, from, merge, of, Subject } = require('rxjs')
const {
  bufferTime,
  delay,
  expand,
  filter,
  mergeMap,
  reduce,
  shareReplay,
  tap
} = require('rxjs/operators')
const {
  broadcast,
  differenceRef,
  dirPaths,
  getLogger,
  mergePaths
} = require('../utils')
const {
  albumsModel,
  artistsModel,
  playlistsModel,
  tracksModel
} = require('../models')

const logger = getLogger('services/tracks')

// Because synchronizing folders may broadcast a lot of messages to the UI,
// this queue is a buffer to only broadcast once every second (see listen())
const messages$ = new Subject()

const sorters = {
  /**
   * Sort tracks by their track number (in tags): consider disk number, then track number
   * @param {AbstractTrackList} list      - the list containing these tracks
   * @param {array<TracksModel>} results  - the tracks
   * @returns {array<TracksModel>} sorted tracks
   */
  trackNo: (list, results) =>
    results.sort((t1, t2) =>
      t1.tags.disk.no !== t2.tags.disk.no
        ? (t1.tags.disk.no || Infinity) - (t2.tags.disk.no || Infinity)
        : (t1.tags.track.no || Infinity) - (t2.tags.track.no || Infinity)
    ),
  /**
   * Sort tracks by their rank in the list
   * @param {AbstractTrackList} list      - the list containing these tracks
   * @param {array<TracksModel>} results  - the tracks
   * @returns {array<TracksModel>} sorted tracks
   */
  rank: (list, results) =>
    list.trackIds
      .map(id => results.find(track => track.id === id))
      .filter(Boolean)
}

/**
 * Builds a pipeline for processing track.
 * An record cav contain properties:
 * - `${property}Ref`: a reference to a model. If property is "album", consider as an album ref.
 *                     This record will be added to the relevant model, if not the cased already.
 * - `prev-${property}Ref`: a reference to the old model. If property is "album", consider as an album ref.
 *                          This record will be removed from the relevant model.
 * - media: media of the track. If present, will be used as the referenced model.
 * - id: track id.
 * All other properties will be ignored.
 *
 * The generated pipeline will,
 * - collect all records that reference the same model, and save that model.
 * - collect all previous reference to the same model, and save that model (which could remove it).
 * @param {string} property - model name, lower cased
 * @param {constructor} model - the model class
 * @returns {array<Function>} array of reactive functions to be piped to an observable
 */
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

/**
 * Stops the active subscription to message$ observable, if any.
 */
function stopListening() {
  if (subscription) {
    subscription.unsubscribe()
  }
}

function getModel(name) {
  return name === 'track'
    ? tracksModel
    : name === 'artist'
    ? artistsModel
    : name === 'album'
    ? albumsModel
    : playlistsModel
}

module.exports = {
  /**
   * Starts buffering and broadcasting messages to the UI thread:
   * it stops previous subscription (if any) and subscribes to message$
   * observable.
   */
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
          broadcast(type, data.map(getModel(type.split('-')[0]).serializeForUi))
        }
      })
  },

  stopListening,

  /**
   * Starts monitoring new or existing tracks.
   * It first saves them into the database, then it computes new references to Albums and Artists, and updates
   * database accordingly.
   * It broadcasts messages:
   * - `track-changes` for any added track
   * - `album-changes` for any album models created or updated due to references
   * - `artist-changes` for any artist models created or updated due to references
   * - `album-removals` for any existing album removed because no track are referencing them
   * - `artist-removals` for any existing artist removed because no track are referencing them
   * @async
   * @param {array<TracksModel>} tracks - list of added track models
   */
  async add(tracks) {
    const tracks$ = from(tracksModel.save(tracks)).pipe(
      mergeMap(tracks => from(tracks)),
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

  /**
   * Stops monitoring existing tracks.
   * It removes tracks from database, then it computes new references to Albums and Artists, and updates
   * database accordingly.
   * It broadcasts messages:
   * - `track-removal` for any removed track
   * - `album-removals` for any existing album removed because no track are referencing them
   * - `artist-removals` for any existing artist removed because no track are referencing them
   * @async
   * @param {array<number>} trackIds - list of removed track model ids
   */
  async remove(trackIds) {
    const tracks$ = from(tracksModel.removeByIds(trackIds)).pipe(
      mergeMap(tracks => from(tracks)),
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

  /**
   * @typedef {"artist" | "album" | "playlist"} ModelName
   */

  /**
   * Paginated list of artists, albums or playlists, sorted by name
   * @async
   * @param {ModelName} modelName - listed models
   * @param {object} criteria - pagination criteria: see the corresponding AbstractModel.list() method
   * @returns {Page} a page of models
   */
  async list(modelName, criteria) {
    logger.debug({ modelName, criteria }, `list ${modelName}s`)
    const modelClass = getModel(modelName)
    const page = await modelClass.list({ sort: 'name', ...criteria })
    return { ...page, results: page.results.map(modelClass.serializeForUi) }
  },

  /**
   * @typedef {"trackNo" | "rank"} TrackSortBy
   */

  /**
   * Find a given artist, album or playlist with their tracks
   * @async
   * @param {ModelName} modelName - fetched model
   * @param {number} id           - id or the retrieved model
   * @param {TrackSortBy} sortBy  - criteria for sorting returned tracks
   * @returns {AbstractModel|null} the retrieved model, if any
   */
  async fetchWithTracks(modelName, id, sortBy = 'trackNo') {
    logger.debug({ modelName, id, sortBy }, `fetch ${modelName} with tracks`)
    const modelClass = getModel(modelName)
    const model = await modelClass.getById(id)
    if (model) {
      const tracks = await tracksModel.getByIds(model.trackIds)
      model.tracks = sorters[sortBy](model, tracks).map(
        tracksModel.serializeForUi
      )
    }
    return modelClass.serializeForUi(model)
  },

  /**
   * @typedef {object} SearchResult
   * @property {number} size          - 0-based rank of the first model returned
   * @property {number} from          - maximum number of models per page
   * @property {number} totalSum      - total number of results (all models)
   * @property {object} totals        - number of maching models:
   * @property {number} totals.albums   - total number of matching albums
   * @property {number} totals.artists  - total number of matching artists
   * @property {number} totals.tracks - total number of matching tracks
   * @property {Page} albums          - a page of matching albums
   * @property {Page} artists         - a page of matching artists
   * @property {Page} tracks          - a page of matching tracks
   */

  /**
   * Paginated list of artists, albums and tracks containing a given text.
   * See each model for to know which model properties will be considered.
   * *Note:* Playlist are not supported yet.
   * @async
   * @param {string} searched     - the searched text
   * @param {object} criteria     - pagination criteria:
   * @param {number} criteria.from  - 0-based rank of the first model returned
   * @param {number} criteria.size  - maximum number of models per page
   * @returns {SearchResult} a page of results
   */
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
      albums: albums.results.map(albumsModel.serializeForUi),
      artists: artists.results.map(artistsModel.serializeForUi),
      tracks: tracks.results.map(tracksModel.serializeForUi)
    }
  },

  /**
   * From an array of files and folders:
   * - extract parent folders, and add them to the list of monitored folders if needed
   * - get all tracks contained in asked folders
   * - get all tracks associated to asked files
   * - path them to the UI for playing
   * @async
   * @param {array<string>} entries - list of desired files and folders
   * @returns {array<TracksModel} the list of played models (could be empty)
   */
  async play(entries) {
    if (!entries.length) {
      return []
    }
    // breaks a circular dependency
    const settingsService = require('./settings')
    logger.debug({ entries }, `trying to play file entries`)
    const parents = dirPaths(entries)
    const settings = await settingsService.get()
    const { added } = mergePaths(parents, settings.folders)
    // add new folders to monitored list
    if (added.length) {
      logger.debug({ added }, `adding untracked folders`)
      await new Promise(resolve => settingsService.addFolders(added, resolve))
    }
    const tracks = (
      await tracksModel.getByPaths(entries.map(path => resolve(path)))
    ).map(tracksModel.serializeForUi)
    broadcast('play-tracks', tracks)

    logger.debug(
      { tracks: tracks.map(({ path, id }) => ({ id, path })) },
      `playing tracks`
    )
    return tracks
  },

  async compare() {
    logger.info('comparing provider tracks')
    // providers/local depends on services/tracks: use late require to avoid a circular dependency
    for (const provider of require('../providers').allProviders) {
      await provider.compareTracks()
    }
    logger.info('tracks comparison ended')
  }
}
