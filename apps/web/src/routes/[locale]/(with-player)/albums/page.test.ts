import * as env from '$app/environment'
import { faker } from '@faker-js/faker'
import type { Agent, Album } from '@melodie/common/models'
import { addId } from '@melodie/common/tests'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageLoadEvent } from './$types'
import { load } from './+page'

describe('universal load()', () => {
	const fetch: Mock<typeof global.fetch> = vi.fn()

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const albums: Album[] = [
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			mediaCount: 0,
			trackIds: [faker.number.int()],
			refs: []
		},
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: null,
			mediaCount: 0,
			trackIds: [faker.number.int(), faker.number.int()],
			refs: []
		},
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			media: faker.system.filePath(),
			mediaCount: 1,
			trackIds: [faker.number.int()],
			refs: []
		}
	].map(addId)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('only returns parent data on server', async () => {
		vi.spyOn(env, 'browser', 'get').mockReturnValue(false)
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

	it('fetches all albums on client', async () => {
		vi.spyOn(env, 'browser', 'get').mockReturnValue(true)
		fetch.mockResolvedValueOnce(Response.json({ data: albums }))
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)

		expect(response).toEqual({
			...data,
			albums: expect.any(Promise)
		})
		expect(fetch).toHaveBeenCalledWith('/api/albums')
		expect(fetch).toHaveBeenCalledOnce()

		expect(await (response as Record<string, unknown>).albums).toEqual(albums)
	})
})
