import { injectAnalytics } from '@vercel/analytics/sveltekit'
import { browser, dev } from '$app/environment'
import { trackQueue } from '$lib/client'
import type { LayoutLoad } from './$types'

injectAnalytics({ mode: dev ? 'development' : 'production' })

export const load: LayoutLoad = async () => {
	if (browser) {
		await trackQueue.init()
	}
}
