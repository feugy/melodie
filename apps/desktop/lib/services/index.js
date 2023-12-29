import { models, services, utils } from '@melodie/core'

import { focusOnNotification, getStoragePath } from '../utils/index.js'
import * as playlists from './playlists.js'
import * as settings from './settings.js'
import * as tracks from './tracks.js'

export async function start(publicFolder, win, descriptor, desiredPort) {
  const { version, name } = descriptor
  await models.init(getStoragePath('db.sqlite3'))

  const { close, address, totp } = await utils.initConnection(
    {
      core: {
        focusWindow: () => focusOnNotification(win),
        getVersions: () => ({
          ...process.versions,
          [name]: version
        })
      },
      media: services.media,
      playlists,
      settings,
      tracks
    },
    publicFolder,
    desiredPort
  )

  const port = +address.split(':')[2]
  await settings.init(port)
  tracks.listen()
  return { close, port, totp }
}

export const playFiles = tracks.play
