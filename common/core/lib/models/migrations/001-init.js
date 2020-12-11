'use strict'

exports.up = async function (db) {
  await db.schema
    .createTable('settings', table => {
      table.integer('id').primary()
      table.json('folders')
      table.json('providers')
      table.string('locale')
      table.integer('openCount').unsigned()
    })
    .createTable('albums', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
    .createTable('artists', table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
    .createTable('playlists', table => {
      table.integer('id').primary()
      table.string('name')
      table.text('desc')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
    .createTable('tracks', table => {
      table.integer('id').primary()
      table.string('path')
      table.string('media')
      table.json('tags')
      table.json('artistRefs')
      table.json('albumRef')
      table.float('mtimeMs')
    })
  // do not use settingsModel.save(): it'll fail on further migration that may add new JSON columns
  await db('settings').insert({
    id: 1000,
    folders: JSON.stringify([]),
    openCount: 1,
    providers: JSON.stringify({ audiodb: {}, discogs: {} })
  })
}

exports.down = async function ({ schema }) {
  await schema
    .dropTable('tracks')
    .dropTable('playlists')
    .dropTable('artists')
    .dropTable('albums')
    .dropTable('settings')
}
