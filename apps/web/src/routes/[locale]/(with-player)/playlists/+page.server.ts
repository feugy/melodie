import { isPlaylistVisibleToUser, list } from '$lib/server'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	let total = 0
	for await (const playlist of list('playlists', 100)) {
		if (isPlaylistVisibleToUser(playlist, locals.session?.userId)) {
			total += 1
		}
	}
	return {
		total
	}
}
