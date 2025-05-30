import { database, loadTracks } from '$lib/server'
import { artistsModel } from '@melodie/common/models'
import type { Album, Track } from '@melodie/common/models'
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
	return { artist, tracks, albums: groupByAlbum(tracks) }
}

function groupByAlbum(tracks: Track[]) {
	const map = new Map<Album['id'], Album>()
	for (const track of tracks) {
		const { mtimeMs, agentId, media, mediaCount, albumRef } = track
		if (albumRef && albumRef[1] !== null) {
			const [id, name] = albumRef
			if (!map.has(id)) {
				map.set(id, {
					id,
					name,
					media,
					mediaCount,
					refs: [],
					trackIds: [],
					agentId,
					mtimeMs
				})
			}
			// biome-ignore lint/style/noNonNullAssertion: the album has been added just above.
			map.get(id)!.trackIds.push(track.id)
		}
	}
	return [...map.values()]
}
