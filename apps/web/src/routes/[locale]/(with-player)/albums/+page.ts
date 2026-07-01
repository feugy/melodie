import { browser } from '$app/environment'
import { base } from '$app/paths'
import { requestJSON } from '$lib/client'
import type { LightAlbum } from '$lib/types'
import type { GETModelResponse } from '../../../api/[kind]/+server'
import type { PageLoad } from './$types'

async function loadAlbums(fetch: typeof global.fetch) {
	return requestJSON<GETModelResponse<LightAlbum>>(
		`${base}/api/albums`,
		undefined,
		fetch
	)
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
