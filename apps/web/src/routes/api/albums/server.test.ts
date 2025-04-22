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
import { GET } from './+server'

describe('GET /api/albums', () => {
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
			agentId: agent.id,
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
	]
		.map(addId)
		.sort((a, b) => a.name.localeCompare(b.name))

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await albumsModel.save(albums)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns all albums', async () => {
		const response = await GET()
		const content = await response.json()
		const data: Partial<Album>[] = albums.map(
			({ id, name, media, mediaCount, refs, agentId, trackIds }) => ({
				id,
				name,
				media,
				mediaCount,
				agentId,
				refs,
				trackIds
			})
		)
		expect(content).toEqual({ data, total: data.length })
	})
})
