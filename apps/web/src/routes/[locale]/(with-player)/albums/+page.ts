import { browser } from '$app/environment'
import { base } from '$app/paths'
import type { LightAlbum } from '$lib/types'
import type { GETModelResponse } from '../../../api/[kind]/+server'
import type { PageLoad } from './$types'

async function loadAlbums(fetch: typeof global.fetch) {
	const response = await fetch(`${base}/api/albums`)
	return response.json() as Promise<GETModelResponse<LightAlbum>>
}

export const load: PageLoad = async ({ data: parentData, fetch }) => {
	if (!browser) {
		return parentData
	}

	return {
		...parentData,
		// lazy load all albums from the client.
		albums: loadAlbums(fetch).then(({ data }) => data)
	}
}
