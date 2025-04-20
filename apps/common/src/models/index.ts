import type { DBConf } from '../types.ts'
import type { AbstractModel } from './abstract-model.ts'
import type { TrackListModel } from './abstract-track-list.ts'
import { type Agent, agentsModel } from './agents.ts'
import { type Album, albumsModel } from './albums.ts'
import { type Artist, artistsModel } from './artists.ts'
import { type Playlist, playlistsModel } from './playlists.ts'
import { type Track, tracksModel } from './tracks.ts'

export { agentsModel, albumsModel, artistsModel, playlistsModel, tracksModel }
export type {
	Agent,
	Album,
	Artist,
	Playlist,
	Track,
	TrackListModel,
	AbstractModel
}

/** Initializes all model classes. */
export async function init(conf: DBConf, migrate = true) {
	await agentsModel.init(conf, migrate)
	await albumsModel.init(conf, false)
	await artistsModel.init(conf, false)
	await tracksModel.init(conf, false)
	await playlistsModel.init(conf, false)
}
