import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { base } from '$app/paths'
import type { Track } from '@melodie/common/models'
import {
	UnauthorizedError,
	getLocaleFromPathname,
	getTracksByIds,
	handleUnauthorizedResponse,
	isUnauthorizedError,
	requestJSON
} from './requests'

const goto = mock(async () => void 0)
const invalidate = mock(async () => void 0)
mock.module('$app/navigation', () => ({ goto, invalidate }))
mock.module('$app/environment', () => ({ browser: true }))

const fetch = spyOn(globalThis, 'fetch')

describe('requestJSON()', () => {
	beforeEach(() => {
		fetch.mockReset()
		goto.mockReset()
	})

	it('returns parsed JSON when request succeeds', async () => {
		fetch.mockResolvedValueOnce(Response.json({ ok: true }))

		expect(await requestJSON<{ ok: boolean }>(`${base}/api/albums`)).toEqual({
			ok: true
		})
		expect(goto).not.toHaveBeenCalled()
	})

	it('redirects to login on 401 responses', async () => {
		fetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		)

		await expect(requestJSON(`${base}/api/albums`)).rejects.toBeInstanceOf(
			UnauthorizedError
		)
		expect(goto).toHaveBeenCalledWith(`${base}/fr`)
		expect(goto).toHaveBeenCalledTimes(1)
	})

	it('avoids duplicate redirects on concurrent 401 responses', async () => {
		fetch.mockResolvedValue(
			new Response(JSON.stringify({ message: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		)

		const responses = await Promise.allSettled([
			requestJSON(`${base}/api/albums`),
			requestJSON(`${base}/api/artists`)
		])

		for (const response of responses) {
			expect(response.status).toBe('rejected')
			if (response.status === 'rejected') {
				expect(response.reason).toBeInstanceOf(UnauthorizedError)
			}
		}
		expect(goto).toHaveBeenCalledTimes(1)
	})

	it('throws regular errors for non-401 responses', async () => {
		fetch.mockResolvedValueOnce(new Response('bad', { status: 500 }))

		await expect(requestJSON(`${base}/api/albums`)).rejects.toThrow(
			'Request failed (500)'
		)
		expect(goto).not.toHaveBeenCalled()
	})
})

describe('isUnauthorizedError()', () => {
	it('returns true only for UnauthorizedError instances', () => {
		expect(isUnauthorizedError(new UnauthorizedError())).toBe(true)
		expect(isUnauthorizedError(new Error('Unauthorized'))).toBe(false)
		expect(isUnauthorizedError(undefined)).toBe(false)
	})
})

describe('getLocaleFromPathname()', () => {
	it('returns locale from pathname when supported', () => {
		expect(getLocaleFromPathname(`${base}/en/albums`)).toBe('en')
	})

	it('falls back to default locale when pathname is unsupported', () => {
		expect(getLocaleFromPathname(`${base}/zz/albums`)).toBe('fr')
	})

	it('falls back to default locale when pathname has no app prefix', () => {
		expect(getLocaleFromPathname('/outside')).toBe('fr')
	})
})

describe('handleUnauthorizedResponse()', () => {
	beforeEach(() => {
		goto.mockReset()
	})

	it('returns false for non-401 responses', async () => {
		const handled = await handleUnauthorizedResponse(
			new Response('ok', { status: 200 })
		)

		expect(handled).toBe(false)
		expect(goto).not.toHaveBeenCalled()
	})

	it('returns true and redirects for 401 responses', async () => {
		const handled = await handleUnauthorizedResponse(
			new Response('nope', { status: 401 })
		)

		expect(handled).toBe(true)
		expect(goto).toHaveBeenCalledWith(`${base}/fr`)
		expect(goto).toHaveBeenCalledTimes(1)
	})
})

describe('getTracksByIds()', () => {
	beforeEach(() => {
		fetch.mockReset()
		goto.mockReset()
	})

	it('returns empty array and skips request for empty ids', async () => {
		expect(await getTracksByIds([])).toEqual([])
		expect(fetch).not.toHaveBeenCalled()
	})

	it('requests tracks endpoint and returns payload data', async () => {
		const tracks = [{ id: 1 }] as unknown as Track[]
		fetch.mockResolvedValueOnce(Response.json({ data: tracks }))

		expect(await getTracksByIds([1])).toEqual(tracks)
		expect(fetch).toHaveBeenCalledWith(`${base}/api/get-tracks`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ids: [1] })
		})
	})
})
