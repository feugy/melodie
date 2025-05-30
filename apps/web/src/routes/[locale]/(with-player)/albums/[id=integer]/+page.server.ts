import { database, loadTracks } from '$lib/server'
import { albumsModel } from '@melodie/common/models'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

async function loadAlbum(id: number) {
	await database.init()
	const album = await albumsModel.getById(id)
	if (!album) {
		return error(404, 'Album not found')
	}
	return album
}

export const load: PageServerLoad = async ({ params: { id } }) => {
	const album = await loadAlbum(Number.parseInt(id))
	return {
		album,
		tracks: await loadTracks(album)
	}
}
