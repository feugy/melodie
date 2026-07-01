import { type Mock, beforeEach, describe, expect, it, mock } from 'bun:test'
import { base } from '$app/paths'
import { makeArtists } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import type { Agent } from '@melodie/common/models'
import type { PageLoadEvent } from './$types'
import { load } from './+page'

const goto = mock(async () => void 0)
mock.module('$app/navigation', () => ({ goto }))

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

	const artists = makeArtists(3, {
		agentId: agent.id,
		bio: { fr: faker.lorem.paragraph() }
	})

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

	it('fetches all artists on client', async () => {
		fetch.mockResolvedValueOnce(Response.json({ data: artists }))
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)

		expect(response).toEqual({
			...data,
			artists: expect.any(Promise)
		})
		expect(fetch).toHaveBeenCalledWith(`${base}/api/artists`)
		expect(fetch).toHaveBeenCalledTimes(1)

		expect(await (response as Record<string, unknown>).artists).toEqual(artists)
	})

	it('redirects to login page when artists API returns 401', async () => {
		fetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			})
		)
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)
		const artistsPromise = (response as Record<string, unknown>)
			.artists as Promise<unknown>

		await expect(artistsPromise).rejects.toThrow('Unauthorized')
		expect(goto).toHaveBeenCalledWith(`${base}/fr`)
		expect(goto).toHaveBeenCalledTimes(1)
	})

	it('surfaces an error when artists API returns 500', async () => {
		fetch.mockResolvedValueOnce(new Response('boom', { status: 500 }))
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)
		const artistsPromise = (response as Record<string, unknown>)
			.artists as Promise<unknown>

		await expect(artistsPromise).rejects.toThrow('Request failed (500)')
		expect(goto).not.toHaveBeenCalled()
	})
})
