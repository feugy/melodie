import type { Kind } from '$lib/types'
import { basename } from 'node:path'
import {
	albumsModel,
	artistsModel,
	playlistsModel,
	tracksModel
} from '@melodie/common/models'
import type { Album, Artist, Playlist, Track } from '@melodie/common/models'
import { database } from './database'

export function list(kind: 'artists', size?: number): AsyncGenerator<Artist>
export function list(kind: 'albums', size?: number): AsyncGenerator<Album>
export function list(kind: 'playlists', size?: number): AsyncGenerator<Playlist>
export async function* list(
	kind: Kind,
	size = 20
): AsyncGenerator<Album | Artist | Playlist> {
	await database.init()
	let from = 0
	let total = 1
	const manager =
		kind === 'artists'
			? artistsModel
			: kind === 'albums'
				? albumsModel
				: playlistsModel
	while (from < total) {
		const page = await manager.list({ size, from, sort: 'name' })
		for (const model of page.results) {
			yield model
		}
		total = page.total
		from += size
	}
}

export async function count(kind: Kind) {
	await database.init()
	return (
		kind === 'artists'
			? artistsModel
			: kind === 'albums'
				? albumsModel
				: playlistsModel
	).count()
}

export async function loadTracks(model: Artist | Album | Playlist) {
	await database.init()
	const tracks = await tracksModel.getByIds(model.trackIds)
	return tracks.map(toClientTrack)
}

/** Replaces the server-side absolute path with the relative path for client consumption. */
export function toClientTrack(track: Track): Track {
	return { ...track, path: track.relativePath ?? basename(track.path) }
}
