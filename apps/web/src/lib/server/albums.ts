import { albumsModel } from '@melodie/common/models'
import { database } from './database'

export async function* listAlbums(size = 20) {
	await database.init()
	let from = 0
	let total = 1
	while (from < total) {
		const page = await albumsModel.list({ size, from, sort: 'name' })
		for (const album of page.results) {
			yield album
		}
		total = page.total
		from += size
	}
}
