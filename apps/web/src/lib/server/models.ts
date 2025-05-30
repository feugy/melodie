import type { Kind } from '$lib/types'
import { albumsModel, artistsModel, tracksModel } from '@melodie/common/models'
import type { Album, Artist } from '@melodie/common/models'
import { database } from './database'

export function list(kind: 'artists', size?: number): AsyncGenerator<Artist>
export function list(kind: 'albums', size?: number): AsyncGenerator<Album>
export async function* list(
	kind: Kind,
	size = 20
): AsyncGenerator<Album | Artist> {
	await database.init()
	let from = 0
	let total = 1
	const manager = kind === 'artists' ? artistsModel : albumsModel
	while (from < total) {
		const page = await manager.list({ size, from, sort: 'name' })
		for (const model of page.results) {
			yield model
		}
		total = page.total
		from += size
	}
}

export async function loadTracks(model: Artist | Album) {
	await database.init()
	return tracksModel.getByIds(model.trackIds)
}
