import { listAlbums } from '$lib/server'
import type { LightAlbum } from '$lib/types'
import { json } from '@sveltejs/kit'

export interface GETAlbumsResponse {
	data: LightAlbum[]
	total: number
}

export async function GET() {
	const data: LightAlbum[] = []
	for await (const { id, name, media, mediaCount, agentId, refs } of listAlbums(
		100
	)) {
		data.push({ id, name, media, mediaCount, agentId, refs })
	}
	return json({ data, total: data.length })
}
