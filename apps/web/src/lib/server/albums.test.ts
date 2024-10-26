import { faker } from '@faker-js/faker'
import { type Album, albumsModel, init } from '@melodie/common/models'
import { addId, cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { listAlbums } from './albums'

describe('albums server utils', () => {
	let conf: DBConf

	const albums: Album[] = [
		{
			name: faker.music.album(),
			mtimeMs: faker.date.recent().getTime(),
			agentId: faker.number.int(),
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
			agentId: faker.number.int(),
			media: faker.system.filePath(),
			mediaCount: 1,
			trackIds: [faker.number.int()],
			refs: []
		}
	]
		.map(addId)
		.sort((a, b) => a.name.localeCompare(b.name))

	beforeAll(async () => {
		conf = await initTestDB()
		await init(conf)
		await albumsModel.save(albums)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	async function consume<T>(generator: AsyncGenerator<T>) {
		const result: T[] = []
		for await (const item of generator) {
			result.push(item)
		}
		return result
	}

	it('returns albums', async () => {
		expect(await consume(listAlbums())).toEqual(albums)
	})

	it('returns albums from multiple pages', async () => {
		expect(await consume(listAlbums(1))).toEqual(albums)
	})
})
