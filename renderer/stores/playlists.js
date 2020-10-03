'use strict'

import { push } from 'svelte-spa-router'
import { showSnack } from './snackbars'
import { createListStore, invoke } from '../utils'
import * as intl from 'svelte-intl'

const store = createListStore('playlist')

export const playlists = store.playlists
export const reset = store.reset
export const list = store.list
export const load = store.load
export const changes = store.changes
export const removals = store.removals
export const isListing = store.isListing

let translate
intl.translate.subscribe(_ => (translate = _))

export async function remove({ id }) {
  return save({ id, trackIds: [] })
}

export async function appendTracks({ id, name, tracks }) {
  const trackIds = tracks.map(({ id }) => id)
  if (!trackIds.length) {
    return null
  }
  const playlist = await (id
    ? invoke('playlists.append', id, trackIds)
    : save({ name, trackIds }))
  showSnack({
    message: translate('playlist _ updated', playlist),
    button: translate('open'),
    action() {
      push(`/playlist/${playlist.id}`)
    }
  })
  return playlist
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
  return invoke('playlists.save', playlist)
}
