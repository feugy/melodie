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
		return logOutAndRedirect()
	}
	if (!locale && !url.pathname.startsWith(`${base}/api/`)) {
		return redirectBasedOnLanguage(url, request.headers.get('accept-language'))
	}

	const token = extractToken(request)
	if (token) {
		locals.session = await recoverSession(token)
	}

	// session may be (un)set by endpoints
	return setCookie(await resolve(event), locals.session?.token)
}

function logOutAndRedirect() {
	return setCookie(
		new Response(null, { status: 307, headers: { location: base } })
	)
}

function redirectBasedOnLanguage(url: URL, languageHeader: string | null) {
	const locale =
		pick(supportedLanguages, languageHeader ?? '', {
			loose: true
		}) || supportedLanguages[0]
	return new Response(null, {
		status: 303,
		headers: {
			location: `${base}/${locale}${url.href.replace(`${url.origin}${base}`, '')}`
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
		sameSite: 'none'
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
