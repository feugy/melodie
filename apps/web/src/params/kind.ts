import type { Kind } from '$lib/types'
import type { ParamMatcher } from '@sveltejs/kit'

export const match = ((param: string): param is Kind => {
	return param === 'artists' || param === 'albums' || param === 'playlists'
}) satisfies ParamMatcher
