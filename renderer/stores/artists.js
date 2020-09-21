'use strict'

import { createListStore, invoke } from '../utils'

const store = createListStore('artist')

export const artists = store.artists
export const reset = store.reset
export const load = store.load
export const changes = store.changes
export const removals = store.removals
export const isListing = store.isListing
export function list() {
  invoke('media.triggerArtistsEnrichment')
  return store.list()
}
