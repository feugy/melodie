import { list } from '$lib/server'
import type { Kind, LightAlbum, LightArtist } from '$lib/types'
import type { Album, Artist } from '@melodie/common/models'
import { type RequestHandler, json } from '@sveltejs/kit'

export interface GETModelResponse<T extends LightArtist | LightAlbum> {
	data: T[]
	total: number
}

export const GET: RequestHandler<{ kind: Kind }> = async ({
	params: { kind }
}) => {
	const data = []
	const extract = kind === 'artists' ? extractArtist : extractAlbum
	for await (const model of list(kind as 'artists', 100)) {
		data.push(extract(model as Artist))
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
