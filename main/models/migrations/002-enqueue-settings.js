'use strict'

const { settingsModel } = require('..')

exports.up = async function ({ schema }) {
  await schema.table(settingsModel.name, table => {
    table
      .json('enqueueBehaviour')
      .defaultTo(JSON.stringify({ clearBefore: true, onClick: true }))
  })
}

exports.down = async function ({ schema }) {
  await schema.table(settingsModel.name, table => {
    table.dropColumn('enqueueBehaviour')
  })
}
