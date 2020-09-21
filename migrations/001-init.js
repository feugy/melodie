'use strict'

const {
  settingsModel,
  albumsModel,
  artistsModel,
  playlistsModel,
  tracksModel
} = require('../main/models')

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
  settingsModel.db = db
  return settingsModel.save({
    id: settingsModel.ID,
    folders: [],
    openCount: 1,
    providers: { audiodb: {}, discogs: {} }
  })
}

exports.down = async function ({ schema }) {
  return schema
    .dropTable(tracksModel.name)
    .dropTable(playlistsModel.name)
    .dropTable(artistsModel.name)
    .dropTable(albumsModel.name)
    .dropTable(settingsModel.name)
}
