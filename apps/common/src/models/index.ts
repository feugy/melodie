import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { DBConf } from '../types.ts'
import { AbstractModel } from './abstract-model.ts'
import type { TrackListModel } from './abstract-track-list.ts'
import { type Agent, agentsModel } from './agents.ts'
import { type Album, albumsModel } from './albums.ts'
import { type Artist, artistsModel } from './artists.ts'
import { type Playlist, playlistsModel } from './playlists.ts'
import { type Session, sessionsModel } from './sessions.ts'
import { type Settings, settingsModel } from './settings.ts'
import { type Track, tracksModel } from './tracks.ts'
import { type User, usersModel } from './users.ts'

export {
	AbstractModel,
	agentsModel,
	albumsModel,
	artistsModel,
	playlistsModel,
	sessionsModel,
	settingsModel,
	tracksModel,
	usersModel
}
export type {
	Agent,
	Album,
	Artist,
	Playlist,
	Session,
	Settings,
	Track,
	TrackListModel,
	User
}

/** Initializes all model classes. */
export async function init(conf: DBConf, migrate = true) {
	await mkdir(dirname(conf.filename), { recursive: true })
	await usersModel.init(conf, migrate)
	await sessionsModel.init(conf, false)
	await settingsModel.init(conf, false)
	await agentsModel.init(conf, false)
	await albumsModel.init(conf, false)
	await artistsModel.init(conf, false)
	await tracksModel.init(conf, false)
	await playlistsModel.init(conf, false)
}
