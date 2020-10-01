'use strict'

const {
  settingsModel,
  albumsModel,
  artistsModel,
  playlistsModel,
  tracksModel
} = require('../')

exports.up = async function (db) {
  await db.schema
    .createTable(settingsModel.name, table => {
      table.integer('id').primary()
      table.json('folders')
      table.json('providers')
      table.string('locale')
      table.integer('openCount').unsigned()
    })
    .createTable(albumsModel.name, table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
    .createTable(artistsModel.name, table => {
      table.integer('id').primary()
      table.string('name')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
    .createTable(playlistsModel.name, table => {
      table.integer('id').primary()
      table.string('name')
      table.text('desc')
      table.string('media')
      table.integer('processedEpoch')
      table.json('trackIds')
      table.json('refs')
    })
    .createTable(tracksModel.name, table => {
      table.integer('id').primary()
      table.string('path')
      table.string('media')
      table.json('tags')
      table.json('artistRefs')
      table.json('albumRef')
      table.float('mtimeMs')
    })
  // do not use settingsModel.save(): it'll fail on further migration that may add new JSON columns
  await db(settingsModel.name).insert({
    id: settingsModel.ID,
    folders: JSON.stringify([]),
    openCount: 1,
    providers: JSON.stringify({ audiodb: {}, discogs: {} })
  })
}

exports.down = async function ({ schema }) {
  await schema
    .dropTable(tracksModel.name)
    .dropTable(playlistsModel.name)
    .dropTable(artistsModel.name)
    .dropTable(albumsModel.name)
    .dropTable(settingsModel.name)
}
