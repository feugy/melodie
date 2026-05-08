import { base } from '$app/paths'
import { recoverSession } from '$lib/server'
import { supportedLanguages } from '$lib/utils'
import type { Handle } from '@sveltejs/kit'
import { pick } from 'accept-language-parser'
import cookie, { type SerializeOptions } from 'cookie'

export const handle: Handle = async ({ event, resolve }) => {
	const {
		url,
		request,
		locals,
		params: { locale }
	} = event

	if (url.pathname === `${base}/logout`) {
		// log out page
		return logOutAndRedirect()
	}
	if (url.pathname === `${base}/${locale}`) {
		// login page, always accessible, session may be set by route
		return setCookie(await resolve(event), locals.session?.token)
	}
	if (!locale && !url.pathname.startsWith(`${base}/api/`)) {
		// serve local page (unless for API routes)
		return redirectBasedOnLanguage(
			url.href.replace(`${url.origin}${base}`, ''),
			request.headers.get('accept-language')
		)
	}
	locals.session = await recoverSession(extractToken(request))
	if (!locals.session) {
		// redirect to login without token
		return redirectBasedOnLanguage('', request.headers.get('accept-language'))
	}

	return await resolve(event)
}

function logOutAndRedirect() {
	return setCookie(
		new Response(null, { status: 307, headers: { location: base } })
	)
}

function redirectBasedOnLanguage(
	destination: string,
	languageHeader: string | null
) {
	const locale =
		pick(supportedLanguages, languageHeader ?? '', {
			loose: true
		}) || supportedLanguages[0]

	return new Response(null, {
		status: 303,
		headers: {
			location: `${base}/${locale}${destination}`
		}
	})
}

function extractToken(request: Request) {
	return cookie.parse(request.headers.get('cookie') || '').token
}

function setCookie(response: Response, token?: string) {
	const options: SerializeOptions = {
		path: '/',
		secure: true,
		httpOnly: true,
		sameSite: 'lax'
	}
	if (!token) {
		options.expires = new Date(1)
	}
	response.headers.set(
		'set-cookie',
		cookie.serialize('token', token ?? '', options)
	)
	return response
}
