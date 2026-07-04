import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { base } from '$app/paths'

const goto = mock(async () => void 0)
const invalidate = mock(async () => void 0)
mock.module('$app/navigation', () => ({ goto, invalidate }))
mock.module('$app/environment', () => ({ browser: true }))

const fetch = spyOn(globalThis, 'fetch')

describe('client session', () => {
	beforeEach(() => {
		fetch.mockReset()
		goto.mockReset()
	})

	it('refreshes the auth session through the API', async () => {
		const { refreshAuthSession } = await import('./session')
		const expiredSession = { exp: Math.floor(Math.random() * 1000) }
		fetch.mockResolvedValueOnce(Response.json(expiredSession))

		await expect(refreshAuthSession()).resolves.toEqual(expiredSession)
		expect(fetch).toHaveBeenCalledWith(`${base}/api/auth/refresh`, {
			method: 'POST'
		})
		expect(goto).not.toHaveBeenCalled()
	})

	it('redirects to login when refresh returns 401', async () => {
		const { refreshAuthSession } = await import('./session')
		const { UnauthorizedError } = await import('./requests')
		fetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		)

		await expect(refreshAuthSession()).rejects.toBeInstanceOf(UnauthorizedError)
		expect(goto).toHaveBeenCalledTimes(1)
	})

	it('deduplicates concurrent refresh calls', async () => {
		const { refreshAuthSession } = await import('./session')
		const expiredSession = { exp: Math.floor(Math.random() * 1000) }
		fetch.mockResolvedValue(Response.json(expiredSession))

		const responses = await Promise.all([
			refreshAuthSession(),
			refreshAuthSession()
		])
		expect(responses[0]).toEqual(expiredSession)
		expect(responses[1]).toEqual(expiredSession)
		expect(fetch).toHaveBeenCalledTimes(1)
	})
})
