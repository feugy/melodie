import { albumsModel } from './albums.js'
import { artistsModel } from './artists.js'
import { playlistsModel } from './playlists.js'
import { settingsModel } from './settings.js'
import { tracksModel } from './tracks.js'

/**
 * Initialize all model classes.
 * @async
 * @param  {...any} args - passed the model's init functions
 */
export async function init(...args) {
  await settingsModel.init(...args)
  await albumsModel.init(...args)
  await artistsModel.init(...args)
  await tracksModel.init(...args)
  await playlistsModel.init(...args)
}

export { albumsModel } from './albums.js'
export { artistsModel } from './artists.js'
export { playlistsModel } from './playlists.js'
export { settingsModel } from './settings.js'
export { tracksModel } from './tracks.js'
