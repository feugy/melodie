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

async function start(port, publicFolder, win, descriptor) {
  const { version, name } = descriptor
  await models.init(getStoragePath('db.sqlite3'))

  const { close } = await initConnection(
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
    port
  )

  await settings.init()
  tracks.listen()
  return close
}

module.exports = { start, playFiles: tracks.play }
