import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { base } from '$app/paths'
import { supportedLanguages } from '$lib/utils'
import type { Track } from '@melodie/common/models'
import type { POSTGetTracksResponse } from '../../routes/api/get-tracks/+server'

// Prevent multiple concurrent 401 responses from triggering duplicate redirects.
let isRedirectingToLogin = false

export class UnauthorizedError extends Error {
	constructor() {
		super('Unauthorized')
	}
}

export function isUnauthorizedError(
	error: unknown
): error is UnauthorizedError {
	return error instanceof UnauthorizedError
}

export function getLocaleFromPathname(pathname: string) {
	const prefix = `${base}/`
	if (!pathname.startsWith(prefix)) {
		return supportedLanguages[0]
	}
	const locale = pathname.slice(prefix.length).split('/')[0]
	return supportedLanguages.includes(
		locale as (typeof supportedLanguages)[number]
	)
		? locale
		: supportedLanguages[0]
}

export async function handleUnauthorizedResponse(response: Response) {
	if (response.status !== 401) {
		return false
	}
	if (browser && !isRedirectingToLogin) {
		isRedirectingToLogin = true
		try {
			const pathname =
				typeof window !== 'undefined' ? window.location.pathname : ''
			const locale = getLocaleFromPathname(pathname)
			await goto(`${base}/${locale}`)
		} finally {
			isRedirectingToLogin = false
		}
	}
	return true
}

export async function requestJSON<T>(
	input: string,
	init?: RequestInit,
	fetcher: typeof global.fetch = fetch
): Promise<T> {
	const response =
		init === undefined ? await fetcher(input) : await fetcher(input, init)
	if (await handleUnauthorizedResponse(response)) {
		throw new UnauthorizedError()
	}
	if (!response.ok) {
		throw new Error(`Request failed (${response.status})`)
	}

	return response.json() as Promise<T>
}

export async function getTracksByIds(ids: number[]): Promise<Track[]> {
	if (ids.length === 0) return []
	const { data } = await requestJSON<POSTGetTracksResponse>(
		`${base}/api/get-tracks`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ids })
		}
	)
	return data
}
