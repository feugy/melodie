import { count } from '$lib/server'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	return {
		total: await count('artists')
	}
}
