import { list } from '$lib/server'
import { take } from '$lib/utils'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	return {
		// synchronously returns a small set of artists for SSR.
		firstArtists: await take(list('artists'), 20)
	}
}
