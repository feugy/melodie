import { createListStore, invoke } from '../utils'

const store = createListStore('album', 'trackNo')

export const albums = store.albums
export const reset = store.reset
export const load = store.load
export const changes = store.changes
export const removals = store.removals
export const isListing = store.isListing
export function list() {
  invoke('media.triggerAlbumsEnrichment')
  return store.list()
}
