'use strict'

import { createListStore } from '../utils'

const store = createListStore('artist')

export const artists = store.artists
export const reset = store.reset
export const list = store.list
export const load = store.load
export const changes = store.changes
export const removals = store.removals
