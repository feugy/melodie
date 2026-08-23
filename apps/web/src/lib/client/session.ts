import { browser } from '$app/environment'
import { base } from '$app/paths'
import { UnauthorizedError, handleUnauthorizedResponse } from './requests.ts'

let authRefreshTimeout: ReturnType<typeof setTimeout> | undefined
let authRefreshRequest: Promise<{ exp: number }> | undefined

const REFRESH_BEFORE_EXPIRY_MS = 3 * 60 * 1000

export async function refreshAuthSession(fetcher: typeof global.fetch = fetch) {
	if (authRefreshRequest) {
		return authRefreshRequest
	}
	authRefreshRequest = (async () => {
		const response = await fetcher(`${base}/api/auth/refresh`, {
			method: 'POST'
		})
		if (await handleUnauthorizedResponse(response)) {
			throw new UnauthorizedError()
		}
		if (!response.ok) {
			throw new Error(`Session refresh failed (${response.status})`)
		}
		return (await response.json()) as { exp: number }
	})()
	try {
		return await authRefreshRequest
	} finally {
		authRefreshRequest = undefined
	}
}

export function autoRefreshSession(
	fetcher: typeof global.fetch = fetch
): () => void {
	if (!browser || authRefreshTimeout !== undefined) {
		return () => {}
	}

	function doRefresh() {
		authRefreshTimeout = undefined
		void refreshAuthSession(fetcher)
			.then(({ exp }) => {
				const delayMs = Math.max(
					0,
					exp * 1000 - Date.now() - REFRESH_BEFORE_EXPIRY_MS
				)
				authRefreshTimeout = setTimeout(doRefresh, delayMs)
			})
			.catch(() => undefined)
	}

	authRefreshTimeout = setTimeout(doRefresh, 0)

	return () => {
		if (authRefreshTimeout === undefined) {
			return
		}
		clearTimeout(authRefreshTimeout)
		authRefreshTimeout = undefined
	}
}
