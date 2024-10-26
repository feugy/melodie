import { hash } from '../utils/index.js'

export const addId = obj => ({ ...obj, id: hash(obj.name) })

export const makeRef = value => [hash(value), value]

export const addRefs = track => ({
  ...track,
  albumRef: track.tags.album ? makeRef(track.tags.album) : [1, null],
  artistRefs: track.tags.artists.length
    ? track.tags.artists.map(makeRef)
    : [[1, null]]
})
