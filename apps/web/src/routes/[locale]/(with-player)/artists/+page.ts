import { browser } from '$app/environment'
import { base } from '$app/paths'
import { requestJSON } from '$lib/client'
import type { LightArtist } from '$lib/types'
import type { GETModelResponse } from '../../../api/[kind]/+server'
import type { PageLoad } from './$types'

async function loadArtists(fetch: typeof global.fetch) {
	return requestJSON<GETModelResponse<LightArtist>>(
		`${base}/api/artists`,
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
		// lazy load all artists from the client.
		artists: loadArtists(fetch).then(({ data }) => data)
	}
}
