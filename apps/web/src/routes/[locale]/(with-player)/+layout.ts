import { browser } from '$app/environment'
import { trackQueue } from '$lib/client'
import type { LayoutLoad } from '../../$types'

let queueInitPromise: Promise<void> | null = null

export const load: LayoutLoad = async ({ data }) => {
	if (browser && queueInitPromise === null) {
		queueInitPromise = trackQueue.init()
	}

	return {
		...data,
		trackQueueLoading: browser ? queueInitPromise : Promise.resolve()
	}
}
