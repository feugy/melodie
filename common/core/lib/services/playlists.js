import { playlistsModel, tracksModel } from '../models/index.js'
import { formats, write } from '../providers/local/playlist.js'
import { broadcast, difference, getLogger, hash } from '../utils/index.js'
import * as tracksService from './tracks.js'

const logger = getLogger('services/playlists')

/**
 * Trim out fields that are not supported Playlist properties.
 * @param {object} data - playlist data to clean
 * @returns {object} data containing only supported Playlist properties
 */
function pickData({ id, name, media, desc, trackIds }) {
  // whitelist saved data
  return { id, name, media, desc, trackIds }
}

// array of playlists marked for integrity check
const toCheck = []

/**
 * Saves a given playlist (it could remove it if it has no tracks), and broadcasts `playlist-removals`
 * or `playlist-changes` event.
 * @param {PlaylistModel} playlist            - the saved playlist
 * @param {boolean} [markForChecking = false] - true to mark playlist for integrity check
 * @returns {PlaylistModel|undefined} the saved playlist (if not removed for the lack of tracks)
 */
async function saveAndBroadcast(playlist, markForChecking = false) {
  const {
    saved: [saved],
    removedIds
  } = await playlistsModel.save(playlist)
  const serialized = playlistsModel.serializeForUi(saved)
  if (removedIds.length) {
    broadcast(`playlist-removals`, [removedIds[0]])
  } else {
    broadcast(`playlist-changes`, [serialized])
    if (markForChecking) {
      toCheck.push(saved)
    }
  }
  return serialized
}

/**
 * Saves a new or existing playlist to database. If the saved playlist has no track ids, it is removed.
 * If not set, adds a random id.
 * The passed track ids will override the ones already present (no merge).
 * When the playlist is marked for check, its integrity will be validated during next `checkIntegrity()`.
 *
 * It will broadcast `playlist-removals` or `playlist-changes` event.
 *
 * @async
 * @param {PlaylistModel} playlist            - playlist to save
 * @param {boolean} [markForChecking = false] - mark model for further validation
 * @returns {PlaylistModel} saved playlist (with generated id if needed)
 */
export async function save(playlist, markForChecking = false) {
  logger.debug({ playlist }, `save playlist`)
  if (!playlist.id) {
    playlist.id = hash(Date.now().toString())
  }
  return saveAndBroadcast(pickData(playlist), markForChecking)
}

/**
 * Appends some track ids to an existing playlist.
 * Does nothing when no playlist is matching the passed id.
 * @async
 * @param {string} id                     - the playlist id
 * @param {array<string>|string} trackIds - list (or single) of appended track ids
 * @returns {PlaylistModel} saved playlist, or null
 */
export async function append(id, trackIds) {
  const playlist = await playlistsModel.getById(id)
  if (!playlist) {
    logger.debug({ id, trackIds }, `attempt to add to an unknown playlist`)
    return null
  }
  logger.debug({ playlist, trackIds }, `append to playlist`)
  const {
    saved: [saved]
  } = await playlistsModel.save({
    ...playlist,
    trackIds: [
      ...playlist.trackIds,
      ...(Array.isArray(trackIds) ? trackIds : [trackIds])
    ]
  })
  const serialized = playlistsModel.serializeForUi(saved)
  broadcast(`playlist-changes`, [serialized])
  return serialized
}

/**
 * For all playlist marked for checking, trimout all track ids that do not refer to actual tracks.
 * Does nothing unless some playlist were marked for checking.
 */
export async function checkIntegrity() {
  if (toCheck.length) {
    for (const playlist of toCheck) {
      // get ids of existing tracks
      const ids = (await tracksModel.getByIds(playlist.trackIds)).map(
        ({ id }) => id
      )
      const trackIds = []
      for (const id of playlist.trackIds) {
        // filter original list to keep only the existing ids, with the same ordering
        if (ids.includes(id)) {
          trackIds.push(id)
        }
      }
      // if we found differences, save the filtered ids
      if (difference(playlist.trackIds, trackIds).length) {
        await saveAndBroadcast({ ...playlist, trackIds })
      }
    }
    toCheck.splice(0, toCheck.length)
  }
}

/**
 * Exports a given playlist into a playlist file.
 * It delegates to `selectPath()` the responsability to choose an file path to receive the playlist content.
 * @async
 * @param {number} id           - the serialized playlist id
 * @param {function} selectPath - asynchronous function called with playlist and supported format array to
 *                                return the written file path
 * @returns {string|null} the written file path
 */
export async function exportPlaylist(id, selectPath) {
  const playlist = await tracksService.fetchWithTracks('playlist', id, 'rank')
  if (!playlist) {
    return null
  }

  const filePath = await selectPath(playlist, formats)
  if (!filePath) {
    return null
  }

  await write(filePath, playlist)
  return filePath
}
