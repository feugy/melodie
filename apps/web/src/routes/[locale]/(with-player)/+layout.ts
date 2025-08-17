import { browser } from '$app/environment'
import { trackQueue } from '$lib/client'
import type { LayoutLoad } from '../../$types'

export const load: LayoutLoad = async ({ data }) => {
	return {
		...data,
		trackQueueLoading: browser ? trackQueue.init() : Promise.resolve()
	}
}
