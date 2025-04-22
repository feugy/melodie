import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	type Album,
	agentsModel,
	albumsModel,
	init
} from '@melodie/common/models'
import { addId, cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import type { PageServerLoadEvent } from './$types'
import { load } from './+page.server'

describe('server load()', () => {
	let conf: DBConf

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

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await albumsModel.save(albums)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns agents and first albums withCovers', async () => {
		const response = await load({
			params: { locale: 'fr' }
		} as PageServerLoadEvent)

		expect(response).toEqual({
			firstAlbums: expect.arrayContaining(albums)
		})
		expect((response as Record<string, unknown>).firstAlbums).toHaveLength(
			albums.length
		)
	})
})
