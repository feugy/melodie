'use strict'

import { createListStore, invoke } from '../utils'

const store = createListStore('playlist')

export const playlists = store.playlists
export const reset = store.reset
export const list = store.list
export const load = store.load
export const changes = store.changes
export const removals = store.removals

export async function remove({ id }) {
  return save({ id, trackIds: [] })
}

export async function appendTracks({ id, name, tracks }) {
  const trackIds = tracks.map(({ id }) => id)
  if (!trackIds.length) {
    return null
  }
  return id
    ? invoke('playlistsManager.append', id, trackIds)
    : save({ name, trackIds })
}

export async function removeTrack(playlist, index) {
  playlist.trackIds.splice(index, 1)
  return save(playlist)
}

export async function moveTrack(playlist, { from, to }) {
  playlist.trackIds.splice(to, 0, ...playlist.trackIds.splice(from, 1))
  return save(playlist)
}

export async function save(playlist) {
  return invoke('playlistsManager.save', playlist)
}
