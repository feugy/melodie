'use strict'

exports.up = async function ({ schema }) {
  await schema
    .table('settings', table => {
      table.json('isBroadcasting').defaultTo('false')
      table.integer('broadcastPort')
    })
    .table('albums', table => {
      table.integer('mediaCount').defaultTo(1)
    })
    .table('artists', table => {
      table.integer('mediaCount').defaultTo(1)
    })
    .table('tracks', table => {
      table.integer('mediaCount').defaultTo(1)
    })
    .table('playlists', table => {
      table.integer('mediaCount').defaultTo(1)
    })
}

exports.down = async function ({ schema }) {
  await schema
    .table('settings', table => {
      table.dropColumn('isBroadcasting')
      table.dropColumn('broadcastPort')
    })
    .table('albums', table => {
      table.dropColumn('mediaCount')
    })
    .table('artists', table => {
      table.dropColumn('mediaCount')
    })
    .table('tracks', table => {
      table.dropColumn('mediaCount')
    })
    .table('playlists', table => {
      table.dropColumn('mediaCount')
    })
}
