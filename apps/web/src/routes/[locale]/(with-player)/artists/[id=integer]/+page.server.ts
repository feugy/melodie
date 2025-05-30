import { database, loadTracks } from '$lib/server'
import { groupByAlbum } from '$lib/utils/tracks'
import { artistsModel } from '@melodie/common/models'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

async function loadArtist(id: number) {
	await database.init()
	const artist = await artistsModel.getById(id)
	if (!artist) {
		return error(404, 'Artist not found')
	}
	return artist
}

export const load: PageServerLoad = async ({ params: { id } }) => {
	const artist = await loadArtist(Number.parseInt(id))
	const tracks = await loadTracks(artist)
	return { artist, albumsWithTracks: groupByAlbum(tracks) }
}
