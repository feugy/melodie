import type { AssetData } from '$lib/types'
import type { ParamMatcher } from '@sveltejs/kit'

export const match = ((param: string): param is AssetData => {
	return param === 'media' || param === 'data'
}) satisfies ParamMatcher
