import { listAlbums } from '$lib/server'
import { take } from '$lib/utils'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	return {
		// synchronously returns a small set of albums for SSR.
		firstAlbums: await take(listAlbums(), 20)
	}
}
