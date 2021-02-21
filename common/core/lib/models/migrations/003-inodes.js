'use strict'

const { stat } = require('fs-extra')
const { tracksModel } = require('..')

exports.up = async function (db) {
  await db.schema.table('tracks', table => {
    table.bigInteger('ino')
  })
  // migrate existing data: read all tracks and populate their inodes
  let from = 0
  const size = 100
  tracksModel.db = db
  let page = await tracksModel.list({ from, size })
  while (page.results.length) {
    for (const track of page.results) {
      track.ino = (await stat(track.path)).ino
    }
    await tracksModel.save(page.results)
    from += page.results.length
    page = await tracksModel.list({ from, size })
  }
}

exports.down = async function ({ schema }) {
  await schema.table('tracks', table => {
    table.dropColumn('ino')
  })
}
