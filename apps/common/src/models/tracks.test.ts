import type { Database } from 'bun:sqlite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { join, resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import { addRefs, makeRef } from '../tests/refs.ts'
import type { DBConf } from '../types.ts'
import type { Reference } from '../utils/refs.ts'
import { buildUpsert } from '../utils/sqlite.ts'
import { type Track, TracksModel, tracksModel } from './tracks.ts'

describe('Tracks model', () => {
	let db: Database
	let conf: DBConf
	const title = faker.music.songName()
	const folder1 = resolve('home', 'user', 'my-music')
	const folder2 = resolve('home', 'user', 'desktop')

	const file1 = faker.system.fileName()
	const file2 = faker.system.fileName()
	const file3 = faker.system.fileName()
	const file4 = faker.system.fileName()
	const folderName = faker.word.noun()

	const models = [
		{
			path: join(folder1, file1),
			relativePath: file1,
			tags: JSON.stringify({}),
			media: faker.image.url(),
			mediaCount: faker.number.int({ min: 2, max: 10 }),
			mtimeMs: 1590479078019,
			id: 2634312,
			agentId: null
		},
		{
			path: join(folder1, folderName, file2),
			relativePath: join(folderName, file2),
			media: faker.image.url(),
			mediaCount: faker.number.int({ min: 2, max: 10 }),
			tags: JSON.stringify({
				title,
				artists: [faker.music.artist()],
				album: faker.music.album()
			}),
			mtimeMs: 1591821991051,
			id: 2674312,
			agentId: null
		},
		{
			path: join(folder2, file3),
			relativePath: file3,
			media: null,
			mediaCount: 1,
			tags: JSON.stringify({
				title: `${faker.commerce.productAdjective()} ${title}`,
				artists: [faker.music.artist()]
			}),
			mtimeMs: 1459069600000,
			id: 2639112,
			agentId: null
		},
		{
			path: join('home', 'user', 'library', file4),
			relativePath: file4,
			media: null,
			mediaCount: 1,
			tags: JSON.stringify({
				title: faker.commerce.productName(),
				artists: [],
				album: faker.commerce.productName()
			}),
			mtimeMs: 1472480286000,
			id: 4139112,
			agentId: null
		}
	].map(track => ({ ...track, albumRef: null, artistRefs: null }))

	function hydrate(original: Record<string, unknown>): Track {
		const tags =
			typeof original.tags === 'string'
				? JSON.parse(original.tags)
				: (original.tags as Track['tags'])
		return addRefs({ ...(original as unknown as Track), tags })
	}

	beforeAll(async () => {
		;({ conf, db } = await initTestDB())
		await tracksModel.init(conf)
	})

	beforeEach(async () => {
		await tracksModel.reset()
		const insert = db.prepare(buildUpsert(tracksModel.name, models))
		db.transaction(models => {
			for (const model of models) {
				insert.run(model)
			}
		})(models)
	})

	afterAll(async () => {
		await TracksModel.release()
		await cleanTestTB(conf)
	})

	describe('save()', () => {
		it('adds new track with refs', async () => {
			const path = faker.system.fileName()
			const album = faker.commerce.productName()
			const artists = [faker.music.artist(), faker.music.artist()]
			const track = {
				path,
				relativePath: path,
				media: faker.image.url(),
				mediaCount: faker.number.int({ min: 2, max: 10 }),
				mtimeMs: Date.now(),
				tags: { album, artists, genre: [], duration: 0 },
				id: 2639762,
				agentId: null
			}

			const [{ current, previous }] = await tracksModel.save(track)
			expect(current).toEqual({
				...track,
				albumRef: makeRef(album),
				artistRefs: artists.map(artist => makeRef(artist))
			})
			expect(await tracksModel.getById(track.id)).toEqual(current)
			expect(previous).toBeNull()
		})

		it('handles missing album or artists', async () => {
			const path = faker.system.fileName()
			const track = {
				path,
				relativePath: path,
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: Date.now(),
				tags: { artists: [], genre: [], duration: 0 },
				id: 2639362,
				agentId: null
			}

			const [{ current, previous }] = await tracksModel.save(track)
			expect(current).toEqual({
				...track,
				albumRef: [1, null],
				artistRefs: [[1, null]]
			})
			expect(await tracksModel.getById(track.id)).toEqual(current)
			expect(previous).toBeNull()
		})

		it('distinguishes tracks with same album name but different album artist', async () => {
			const path1 = faker.system.fileName()
			const path2 = faker.system.fileName()
			const album = faker.commerce.productName()
			const artists = [faker.music.artist(), faker.music.artist()]
			const track1 = {
				path: path1,
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: Date.now(),
				tags: {
					album,
					artists: artists.slice(0, 1),
					albumartist: artists[0],
					genre: [],
					duration: 0
				},
				id: 2459112,
				agentId: null
			}
			const track2 = {
				path: path2,
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: Date.now(),
				tags: {
					album,
					artists: artists.slice(1),
					albumartist: artists[1],
					genre: [],
					duration: 0
				},
				id: 3439112,
				agentId: null
			}

			const results = await tracksModel.save([track1, track2])
			expect(results[0].current.albumRef?.[0]).not.toEqual(
				results[1].current.albumRef?.[0]
			)
			expect(results[0].current).toEqual({
				...track1,
				albumRef: makeRef(`${album} --- ${artists[0]}`, album),
				artistRefs: [makeRef(artists[0])]
			})
			expect(results[1].current).toEqual({
				...track2,
				albumRef: makeRef(`${album} --- ${artists[1]}`, album),
				artistRefs: [makeRef(artists[1])]
			})
		})

		it('creates refs for artists and album artists', async () => {
			const album = faker.commerce.productName()
			const artists = [faker.music.artist(), faker.music.artist()]
			const albumartist = faker.music.artist()
			const track = {
				...hydrate(models[1]),
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: Date.now(),
				tags: { album, artists, albumartist, genre: [], duration: 0 }
			}

			const [{ previous, current }] = await tracksModel.save([track])
			expect(current).toEqual({
				...track,
				albumRef: makeRef(`${album} --- ${albumartist}`, album),
				artistRefs: [albumartist, ...artists].map(artist => makeRef(artist))
			})
			expect(await tracksModel.getById(track.id)).toEqual(current)
			expect(previous).toEqual({
				id: track.id,
				tags: JSON.parse(models[1].tags),
				artistRefs: null,
				albumRef: null
			})
		})

		it('removes duplicated (album) artists from refs', async () => {
			const album = faker.commerce.productName()
			const artists = [
				faker.music.artist(),
				faker.music.artist(),
				faker.music.artist()
			]
			const track = {
				...hydrate(models[1]),
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: Date.now(),
				tags: {
					album,
					artists: [artists[0], artists[1], artists[0], artists[2]],
					albumartist: artists[0],
					genre: [],
					duration: 0
				}
			}

			const [{ previous, current }] = await tracksModel.save([track])
			expect(current).toEqual({
				...track,
				albumRef: makeRef(`${album} --- ${artists[0]}`, album),
				artistRefs: artists.map(artist => makeRef(artist))
			})
			expect(await tracksModel.getById(track.id)).toEqual(current)
			expect(previous).toEqual({
				id: track.id,
				tags: JSON.parse(models[1].tags),
				artistRefs: null,
				albumRef: null
			})
		})

		it('returns old refs when saving existing track', async () => {
			const album = faker.commerce.productName()
			const artists = [faker.music.artist(), faker.music.artist()]
			const track = {
				...hydrate(models[1]),
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: Date.now(),
				tags: { album, artists, genre: [], duration: 0 }
			}

			const [{ previous, current }] = await tracksModel.save([track])
			expect(current).toEqual({
				...track,
				albumRef: makeRef(album),
				artistRefs: artists.map(artist => makeRef(artist))
			})
			expect(await tracksModel.getById(track.id)).toEqual(current)
			expect(previous).toEqual({
				id: track.id,
				tags: JSON.parse(models[1].tags),
				artistRefs: null,
				albumRef: null
			})
		})
	})

	describe('listWithTime()', () => {
		it('returns modification time by id', async () => {
			const result = await tracksModel.listWithTime()
			expect(result.get(models[0].id)).toEqual(models[0].mtimeMs)
			expect(result.get(models[1].id)).toEqual(models[1].mtimeMs)
			expect(result.get(models[2].id)).toEqual(models[2].mtimeMs)
			expect(result.get(models[3].id)).toEqual(models[3].mtimeMs)
			expect(result.size).toEqual(models.length)
		})
	})

	describe('list()', () => {
		it('searches tracks with order and pagination', async () => {
			const { total, from, size, sort, results } = await tracksModel.list({
				size: 2,
				from: 1,
				searched: title,
				sort: '-id'
			})
			const sorted = models
				.filter(model => {
					const tags = JSON.parse(model.tags)
					return tags.title?.includes(title)
				})
				.sort((m1, m2) => {
					const t1 = JSON.parse(m1.tags)
					const t2 = JSON.parse(m2.tags)
					return !t1 && t2
						? -1
						: !t2 && t1
							? 1
							: !t1 && !t2
								? 0
								: t2.title > t1.title
									? -1
									: t1.title === t2.title
										? 0
										: 1
				})
			expect(results).toEqual(
				sorted.slice(1).map(model => ({
					...model,
					artistRefs: model.artistRefs as unknown as Reference[],
					agentId: model.agentId ?? null,
					tags: JSON.parse(model.tags)
				}))
			)
			expect(results).toHaveLength(1)
			expect(total).toEqual(sorted.length)
			expect(size).toEqual(2)
			expect(from).toEqual(1)
			expect(sort).toEqual(`+${tracksModel.searchCol}`)
		})

		it('returns empty search results page', async () => {
			const { total, from, size, sort, results } = await tracksModel.list({
				from: 20,
				searched: title
			})
			expect(results).toEqual([])
			expect(total).toEqual(2)
			expect(size).toEqual(10)
			expect(from).toEqual(20)
			expect(sort).toEqual(`+${tracksModel.searchCol}`)
		})

		it('can return empty search results', async () => {
			const { total, from, size, sort, results } = await tracksModel.list({
				size: 2,
				from: 1,
				searched: 'unknown'
			})
			expect(results).toEqual([])
			expect(total).toEqual(0)
			expect(size).toEqual(2)
			expect(from).toEqual(1)
			expect(sort).toEqual(`+${tracksModel.searchCol}`)
		})
	})

	describe('getByPath()', () => {
		it('return direct children and descendants', async () => {
			const results = await tracksModel.getByPaths([folder1])
			expect(results).toEqual(
				expect.arrayContaining(
					[models[0], models[1]].map(model => ({
						...model,
						tags: JSON.parse(model.tags)
					}))
				)
			)
			expect(results).toHaveLength(2)
		})

		it('returns models from different folders', async () => {
			const results = await tracksModel.getByPaths([folder1, folder2])
			expect(results).toEqual(
				expect.arrayContaining(
					models.slice(0, 3).map(model => ({
						...(model as unknown as Track),
						tags: JSON.parse(model.tags)
					}))
				)
			)
			expect(results).toHaveLength(3)
		})

		it('can return an empty list', async () => {
			expect(
				await tracksModel.getByPaths([faker.system.directoryPath()])
			).toEqual([])
		})
	})
})
