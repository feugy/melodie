'use strict'

const {
  models,
  services: { media },
  utils: { initConnection }
} = require('@melodie/core')
const playlists = require('./playlists')
const settings = require('./settings')
const tracks = require('./tracks')
const { getStoragePath, focusOnNotification } = require('../utils')

async function start(publicFolder, win, descriptor, desiredPort) {
  const { version, name } = descriptor
  await models.init(getStoragePath('db.sqlite3'))

  const { close, address } = await initConnection(
    {
      core: {
        focusWindow: () => focusOnNotification(win),
        getVersions: () => ({
          ...process.versions,
          [name]: version
        })
      },
      media,
      playlists,
      settings,
      tracks
    },
    publicFolder,
    desiredPort
  )

  await settings.init()
  tracks.listen()
  return { close, port: +address.split(':')[2] }
}

module.exports = { start, playFiles: tracks.play }
