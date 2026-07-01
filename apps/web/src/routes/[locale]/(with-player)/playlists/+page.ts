import { browser } from '$app/environment'
import { base } from '$app/paths'
import { requestJSON } from '$lib/client'
import type { LightPlaylist } from '$lib/types'
import type { GETModelResponse } from '../../../api/[kind]/+server'
import type { PageLoad } from './$types'

async function loadPlaylists(fetch: typeof global.fetch) {
	return requestJSON<GETModelResponse<LightPlaylist>>(
		`${base}/api/playlists`,
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
		// lazy load all playlists from the client.
		playlists: loadPlaylists(fetch).then(({ data }) => data)
	}
}
