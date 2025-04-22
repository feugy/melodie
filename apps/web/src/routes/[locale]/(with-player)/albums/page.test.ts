import { type Mock, describe, expect, it, mock } from 'bun:test'
import { base } from '$app/paths'
import { faker } from '@faker-js/faker'
import type { Agent, Album } from '@melodie/common/models'
import { addId } from '@melodie/common/tests'
import type { PageLoadEvent } from './$types'
import { load } from './+page'

describe('universal load()', () => {
	const fetch: Mock<typeof global.fetch> = mock()

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
			media: null,
			mediaCount: 0,
			trackIds: [faker.number.int()],
			refs: []
		},
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: null,
			media: null,
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

	it('fetches all albums on client', async () => {
		mock.module('$app/environment', () => ({
			browser: true
		}))
		fetch.mockResolvedValueOnce(Response.json({ data: albums }))
		const data = { foo: faker.lorem.word() }

		const response = await load({ data, fetch } as unknown as PageLoadEvent)

		expect(response).toEqual({
			...data,
			albums: expect.any(Promise)
		})
		expect(fetch).toHaveBeenCalledWith(`${base}/api/albums`)
		expect(fetch).toHaveBeenCalledTimes(1)

		expect(await (response as Record<string, unknown>).albums).toEqual(albums)
	})
})
