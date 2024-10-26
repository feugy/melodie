import { browser } from '$app/environment'
import type { GETAlbumsResponse } from '../../../api/albums/+server'
import type { PageLoad } from './$types'

async function loadAlbum(fetch: typeof global.fetch) {
	const response = await fetch('/api/albums')
	return response.json() as Promise<GETAlbumsResponse>
}

export const load: PageLoad = async ({ data: parentData, fetch }) => {
	if (!browser) {
		return parentData
	}

	return {
		...parentData,
		// lazy load all albums from the client.
		albums: loadAlbum(fetch).then(({ data }) => data)
	}
}
