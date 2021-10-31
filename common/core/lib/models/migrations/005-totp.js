'use strict'
const crypto = require('crypto')

exports.up = async function ({ schema }) {
  await schema.table('settings', table => {
    table.string('totpSecret').defaultTo(crypto.randomUUID())
  })
}

exports.down = async function ({ schema }) {
  await schema.table('settings', table => {
    table.dropColumn('totpSecret')
  })
}
