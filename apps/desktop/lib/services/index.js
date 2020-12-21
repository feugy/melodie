'use strict'

const { join } = require('path')
const ejs = require('ejs')
const { readFile, writeFile } = require('fs-extra')
const {
  models,
  services: { media },
  utils: { initConnection }
} = require('@melodie/core')
const playlists = require('./playlists')
const settings = require('./settings')
const tracks = require('./tracks')
const { getStoragePath, focusOnNotification } = require('../utils')

async function start(publicFolder, win, descriptor) {
  const { version, name } = descriptor
  const port = 8080
  await models.init(getStoragePath('db.sqlite3'))

  await writeFile(
    join(publicFolder, 'index.html'),
    ejs.render(await readFile(join(publicFolder, 'index.ejs'), 'utf8'), {
      port
    })
  )
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
