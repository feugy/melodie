import { redirect } from '@sveltejs/kit'
import { base } from '$app/paths'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ route, params }) => {
	// @ts-expect-error -- locale isn't always defined.
	const locale = params.locale ?? 'fr'
	if (route.id === '/' || route.id === `${base}`) {
		redirect(308, `${base}/${locale}/albums`)
	}
}
