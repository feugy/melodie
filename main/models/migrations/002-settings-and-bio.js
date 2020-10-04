'use strict'

exports.up = async function ({ schema }) {
  await schema
    .table('settings', table => {
      table
        .json('enqueueBehaviour')
        .defaultTo(JSON.stringify({ clearBefore: true, onClick: true }))
    })
    .table('artists', table => {
      table.json('bio')
    })
}

exports.down = async function ({ schema }) {
  await schema
    .table('settings', table => {
      table.dropColumn('enqueueBehaviour')
    })
    .table('artists', table => {
      table.dropColumn('bio')
    })
}
