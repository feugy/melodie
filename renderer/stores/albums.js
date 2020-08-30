'use strict'

import { createListStore } from '../utils'

const store = createListStore('album', 'trackNo')

export const albums = store.albums
export const reset = store.reset
export const list = store.list
export const load = store.load
export const changes = store.changes
export const removals = store.removals
