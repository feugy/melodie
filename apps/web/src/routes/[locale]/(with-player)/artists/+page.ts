import { browser } from '$app/environment'
import { base } from '$app/paths'
import type { LightArtist } from '$lib/types'
import type { GETModelResponse } from '../../../api/[kind]/+server'
import type { PageLoad } from './$types'

async function loadArtists(fetch: typeof global.fetch) {
	const response = await fetch(`${base}/api/artists`)
	return response.json() as Promise<GETModelResponse<LightArtist>>
}

export const load: PageLoad = async ({ data: parentData, fetch }) => {
	if (!browser) {
		return parentData
	}

	return {
		...parentData,
		// lazy load all artists from the client.
		artists: loadArtists(fetch).then(({ data }) => data)
	}
}
