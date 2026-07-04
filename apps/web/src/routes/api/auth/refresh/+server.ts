import { refreshSession, setTokenCookie } from '$lib/server'
import { type RequestHandler, json } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ locals, url }) => {
	if (!locals.session) {
		return json({ message: 'Unauthorized' }, { status: 401 })
	}

	locals.session = await refreshSession({ userId: locals.session.userId })
	return setTokenCookie(
		json({ exp: locals.session?.exp }),
		locals.session.token,
		url?.protocol === 'https:'
	)
}
