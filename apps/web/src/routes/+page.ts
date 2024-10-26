import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ route, params }) => {
	// @ts-expect-error -- locale isn't always defined.
	const locale = params.locale ?? 'fr'
	if (route.id === '/') {
		redirect(308, `/${locale}/albums`)
	}
}
