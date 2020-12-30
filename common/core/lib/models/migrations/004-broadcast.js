'use strict'

exports.up = async function ({ schema }) {
  await schema.table('settings', table => {
    table.json('isBroadcasting').defaultTo('false')
    table.integer('broadcastPort')
  })
}

exports.down = async function ({ schema }) {
  await schema.table('settings', table => {
    table.dropColumn('isBroadcasting')
    table.dropColumn('broadcastPort')
  })
}
