'use strict'

import { createListStore, invoke } from '../utils'

const store = createListStore('playlist')

export const playlists = store.playlists
export const reset = store.reset
export const list = store.list
export const load = store.load
export const changes = store.changes
export const removals = store.removals

export async function appendTracks({ id, name, tracks }) {
  const trackIds = tracks.map(({ id }) => id)
  if (!trackIds.length) {
    return null
  }
  return id
    ? invoke('playlistsManager.append', id, trackIds)
    : invoke('playlistsManager.save', { name, trackIds })
}
