'use strict'

exports.up = async function (db) {
  await db('playlists').insert({
    id: 151120,
    name: 'recent',
    trackIds: JSON.stringify([]),
    refs: JSON.stringify([])
  })
}

exports.down = async function (db) {
  await db('playlists').where('id', 151120).delete()
}
