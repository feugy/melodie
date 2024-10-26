import type { AssetKind } from '$lib/types'
import type { ParamMatcher } from '@sveltejs/kit'

export const match = ((param: string): param is AssetKind => {
	return param === 'tracks' || param === 'albums'
}) satisfies ParamMatcher
