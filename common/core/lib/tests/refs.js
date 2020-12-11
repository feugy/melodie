'use strict'

const { hash } = require('../utils')

exports.addId = obj => ({ ...obj, id: hash(obj.name) })

exports.makeRef = value => [hash(value), value]

exports.addRefs = track => ({
  ...track,
  albumRef: track.tags.album ? exports.makeRef(track.tags.album) : [1, null],
  artistRefs: track.tags.artists.length
    ? track.tags.artists.map(exports.makeRef)
    : [[1, null]]
})
