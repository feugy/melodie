import { faker } from '@faker-js/faker'
import { get } from 'svelte/store'
import { _ } from 'svelte-intl'

export function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function translate(...args) {
  return get(_)(...args)
}

export function makeRef(value) {
  return [faker.number.int(), value]
}

export function addRefs(track) {
  return {
    ...track,
    albumRef: track.tags.album ? makeRef(track.tags.album) : null,
    artistRefs: track.tags.artists.map(makeRef)
  }
}
