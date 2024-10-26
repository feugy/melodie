import { faker } from '@faker-js/faker'
import {
	type Agent,
	type Album,
	type Track,
	agentsModel,
	albumsModel,
	init,
	tracksModel
} from '@melodie/common/models'
import { addId, cleanTestTB, initTestDB, makeRef } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import type { Reference } from '@melodie/common/utils'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PageServerLoadEvent } from './$types'
import { load } from './+page.server'

describe('server load()', () => {
	let conf: DBConf

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const tracks: Track[] = [
		{
			path: faker.system.filePath(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			tags: { artists: [], genre: [], duration: 0 },
			mediaCount: 0,
			albumRef: null,
			artistRefs: [[1, null] as Reference]
		},
		{
			path: faker.system.filePath(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			tags: { artists: [], genre: [], duration: 0 },
			mediaCount: 0,
			albumRef: null,
			artistRefs: [[1, null] as Reference]
		},
		{
			path: faker.system.filePath(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			tags: { artists: [], genre: [], duration: 0 },
			mediaCount: 0,
			albumRef: null,
			artistRefs: [[1, null] as Reference]
		},
		{
			path: faker.system.filePath(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			tags: { artists: [], genre: [], duration: 0 },
			mediaCount: 0,
			albumRef: null,
			artistRefs: [[1, null] as Reference]
		}
	].map(addId)

	const albums: Album[] = [
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			mediaCount: 0,
			trackIds: [tracks[0].id],
			refs: []
		},
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: null,
			mediaCount: 0,
			trackIds: [tracks[1].id, tracks[2].id],
			refs: []
		},
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: agent.id,
			media: faker.system.filePath(),
			mediaCount: 1,
			trackIds: [tracks[3].id],
			refs: []
		}
	].map(addId)

	tracks[0].tags.album = albums[0].name
	tracks[0].albumRef = makeRef(albums[0].name)
	tracks[1].tags.album = albums[1].name
	tracks[1].albumRef = makeRef(albums[1].name)
	tracks[2].tags.album = albums[1].name
	tracks[2].albumRef = makeRef(albums[1].name)
	tracks[3].tags.album = albums[2].name
	tracks[3].albumRef = makeRef(albums[2].name)

	beforeAll(async () => {
		conf = await initTestDB()
		await init(conf)
		await agentsModel.save(agent)
		await albumsModel.save(albums)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('redirects on unknwon album', async () => {
		const promise = load({
			params: { id: '1', locale: 'fr' }
		} as PageServerLoadEvent)
		await expect(promise).rejects.toEqual({
			body: { message: 'Album not found' },
			status: 404
		})
	})

	it('returns album', async () => {
		const response = (await load({
			params: { id: albums[0].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>
		expect(response).toEqual({
			album: { ...albums[0] },
			tracks: expect.arrayContaining(tracks.slice(0, 1))
		})
		expect(response.tracks).toHaveLength(1)
	})

	it('returns album with no agent', async () => {
		const response = (await load({
			params: { id: albums[1].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>
		expect(response).toEqual({
			album: { ...albums[1] },
			tracks: expect.arrayContaining(tracks.slice(1, 3))
		})
		expect(response.tracks).toHaveLength(2)
	})
})
