import { type Mock, beforeEach, describe, expect, it, mock } from 'bun:test'
import { base } from '$app/paths'
import { makePlaylists } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import type { Agent } from '@melodie/common/models'
import type { PageLoadEvent } from './$types'
import { load } from './+page'

const goto = mock(async () => void 0)
const invalidate = mock(async () => void 0)
mock.module('$app/navigation', () => ({ goto, invalidate }))

describe('universal load()', () => {
	const fetch: Mock<typeof global.fetch> = mock()

	beforeEach(() => {
		fetch.mockReset()
		goto.mockReset()
		mock.module('$app/environment', () => ({
			browser: true
		}))
	})

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const playlists = makePlaylists(3)

	it('only returns parent data on server', async () => {
		mock.module('$app/environment', () => ({
			browser: false
		}))
		const parentData = {
			foo: faker.lorem.word(),
			agentById: new Map([[agent.id, agent]])
		}
		const response = await load({
			data: parentData,
			fetch
		} as unknown as PageLoadEvent)

		expect(response).toEqual(parentData)
		expect(fetch).not.toHaveBeenCalled()
	})

	it('fetches all playlists on client', async () => {
		fetch.mockResolvedValueOnce(Response.json({ data: playlists }))
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)

		expect(response).toEqual({
			...data,
			playlists: expect.any(Promise)
		})
		expect(fetch).toHaveBeenCalledWith(`${base}/api/playlists`)
		expect(fetch).toHaveBeenCalledTimes(1)

		expect(await (response as Record<string, unknown>).playlists).toEqual(
			playlists
		)
	})

	it('redirects to login page when playlists API returns 401', async () => {
		fetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		)
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)
		const playlistsPromise = (response as Record<string, unknown>)
			.playlists as Promise<unknown>

		await expect(playlistsPromise).rejects.toThrow('Unauthorized')
		expect(goto).toHaveBeenCalledWith(`${base}/fr`)
		expect(goto).toHaveBeenCalledTimes(1)
	})

	it('surfaces an error when playlists API returns 500', async () => {
		fetch.mockResolvedValueOnce(new Response('boom', { status: 500 }))
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)
		const playlistsPromise = (response as Record<string, unknown>)
			.playlists as Promise<unknown>

		await expect(playlistsPromise).rejects.toThrow('Request failed (500)')
		expect(goto).not.toHaveBeenCalled()
	})
})
