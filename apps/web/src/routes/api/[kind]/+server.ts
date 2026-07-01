import { isPlaylistVisibleToUser, list } from '$lib/server'
import type { Kind, LightAlbum, LightArtist, LightPlaylist } from '$lib/types'
import { tracksModel } from '@melodie/common/models'
import type { Album, Artist, Playlist } from '@melodie/common/models'
import { type RequestHandler, json } from '@sveltejs/kit'

export interface GETModelResponse<
	T extends LightArtist | LightAlbum | LightPlaylist
> {
	data: T[]
	total: number
}

export const GET: RequestHandler<{ kind: Kind }> = async ({
	locals,
	params: { kind }
}) => {
	const userId = locals?.session?.userId
	const data = []
	if (kind === 'artists') {
		for await (const model of list('artists', 100)) {
			data.push(extractArtist(model))
		}
		return json({ data, total: data.length })
	}

	if (kind === 'albums') {
		for await (const model of list('albums', 100)) {
			data.push(extractAlbum(model))
		}
		return json({ data, total: data.length })
	}

	for await (const model of list('playlists', 100)) {
		if (isPlaylistVisibleToUser(model, userId)) {
			data.push(await extractPlaylist(model))
		}
	}
	return json({ data, total: data.length })
}

function extractArtist({
	id,
	name,
	media,
	mediaCount,
	bio,
	agentId,
	refs,
	trackIds
}: Artist): LightArtist {
	return { id, name, media, mediaCount, bio, agentId, refs, trackIds }
}

function extractAlbum({
	id,
	name,
	media,
	mediaCount,
	agentId,
	refs,
	trackIds
}: Album): LightAlbum {
	return { id, name, media, mediaCount, agentId, refs, trackIds }
}

async function extractPlaylist({
	id,
	name,
	media,
	mediaCount,
	refs,
	trackIds
}: Playlist): Promise<LightPlaylist> {
	// Playlists can reference deleted tracks, so only expose ids that still exist.
	const existingTrackIds = new Set(
		(await tracksModel.getByIds(trackIds)).map(track => track.id)
	)
	return {
		id,
		name,
		media,
		mediaCount,
		refs,
		trackIds: trackIds.filter(trackId => existingTrackIds.has(trackId))
	}
}
