import { base } from '$app/paths'
import { recoverSession, setTokenCookie, getTokenFromCookie } from '$lib/server'
import { supportedLanguages } from '$lib/utils'
import type { Handle } from '@sveltejs/kit'
import { pick } from 'accept-language-parser'

export const handle: Handle = async ({ event, resolve }) => {
	const {
		url,
		request,
		locals,
		params: { locale }
	} = event
	const secure = url.protocol === 'https:'

	if (url.pathname === `${base}/logout`) {
		// log out page
		return logOutAndRedirect(secure)
	}

	locals.session = await recoverSession(getTokenFromCookie(request))

	if (url.pathname === `${base}/${locale}`) {
		// login page, always accessible, session may be set by route
		return setTokenCookie(await resolve(event), locals.session?.token, secure)
	}
	if (!locale && !url.pathname.startsWith(`${base}/api/`)) {
		// serve local page (unless for API routes)
		return redirectBasedOnLanguage(
			url.href.replace(`${url.origin}${base}`, ''),
			request.headers.get('accept-language')
		)
	}
	if (!locals.session) {
		// redirect to login or fail API calls without token
		if (url.pathname.startsWith(`${base}/api/`)) {
			return unauthorizedAPIResponse(secure)
		}
		return redirectToLogin(
			locale,
			request.headers.get('accept-language'),
			secure
		)
	}

	return resolve(event)
}

function logOutAndRedirect(secure: boolean) {
	return setTokenCookie(
		new Response(null, { status: 307, headers: { location: base } }),
		undefined,
		secure
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

function redirectToLogin(
	locale: string | undefined,
	languageHeader: string | null,
	secure: boolean
) {
	const response = locale
		? new Response(null, {
				status: 303,
				headers: {
					location: `${base}/${locale}`
				}
			})
		: redirectBasedOnLanguage('', languageHeader)

	setTokenCookie(response, undefined, secure)
	return response
}

function unauthorizedAPIResponse(secure: boolean) {
	const response = new Response(JSON.stringify({ message: 'Unauthorized' }), {
		status: 401,
		headers: {
			'content-type': 'application/json'
		}
	})
	return setTokenCookie(response, undefined, secure)
}
