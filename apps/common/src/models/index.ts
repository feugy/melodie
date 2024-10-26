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
export async function init(conf: DBConf) {
	await agentsModel.init(conf)
	await albumsModel.init(conf)
	await artistsModel.init(conf)
	await tracksModel.init(conf)
	await playlistsModel.init(conf)
}
