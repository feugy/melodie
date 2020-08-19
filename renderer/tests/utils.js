'use strict'

import { get } from 'svelte/store'
import { _ } from 'svelte-intl'
import faker from 'faker'

export function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function translate(...args) {
  return get(_)(...args)
}

export function makeRef(value) {
  return [faker.random.number(), value]
}

export function addRefs(track) {
  return {
    ...track,
    albumRef: track.tags.album ? makeRef(track.tags.album) : null,
    artistRefs: track.tags.artists.map(makeRef)
  }
}
