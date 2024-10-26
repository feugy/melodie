import { faker } from '@faker-js/faker'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import { makeRef } from '../tests/refs.ts'
import type { DBConf, PartialWithReq } from '../types.ts'
import type { Reference } from '../utils/refs.ts'
import { type Album, AlbumsModel, albumsModel } from './albums.ts'
import { type Track, tracksModel } from './tracks.ts'

describe.each([{ kind: 'pg' }, { kind: 'sqlite3' }])(
	'Albums model ($kind}',
	({ kind }) => {
		let conf: DBConf
		const artist1 = faker.person.fullName()
		const artist2 = faker.person.fullName()

		// use fixed ids for consistent ordering
		const tracks: PartialWithReq<Track, 'id' | 'tags'>[] = [
			{
				id: 1,
				path: '1',
				tags: { artists: [artist1], genre: [], duration: 0 }
			},
			{
				id: 2,
				path: '2',
				tags: { artists: [artist1, artist2], genre: [], duration: 0 }
			},
			{
				id: 3,
				path: '3',
				tags: { artists: [artist2], genre: [], duration: 0 }
			},
			{
				id: 4,
				path: '4',
				tags: { artists: [], genre: [], duration: 0 }
			}
		]

		beforeAll(async () => {
			conf = await initTestDB(kind as DBConf['kind'])
			await albumsModel.init(conf)
			await tracksModel.init(conf)
			tracksModel.save(tracks)
		})

		afterAll(async () => {
			await AlbumsModel.release()
			await cleanTestTB(conf)
		})

		describe('save()', () => {
			it('adds new album', async () => {
				const album: PartialWithReq<Album, 'id'> = {
					id: faker.number.int(),
					media: faker.image.url(),
					mtimeMs: 0,
					name: faker.music.album(),
					trackIds: [tracks[0].id, tracks[3].id]
				}

				await albumsModel.save(album)
				expect((await albumsModel.list()).results).toEqual([
					{
						...album,
						mediaCount: 0,
						refs: [makeRef(artist1), [1, null]],
						agentId: null
					}
				])
			})

			it('updates existing album with refs', async () => {
				const album: Album = {
					id: faker.number.int(),
					media: faker.image.url(),
					mediaCount: faker.number.int({ max: 10 }),
					mtimeMs: 0,
					name: faker.music.album(),
					refs: [],
					trackIds: [tracks[0].id, tracks[3].id],
					agentId: null
				}

				expect((await albumsModel.save(album)).saved).toEqual([
					{
						...album,
						refs: [makeRef(artist1), [1, null]]
					}
				])

				album.removedTrackIds = album.trackIds.concat()
				album.trackIds = [tracks[1].id, tracks[2].id]

				const { saved } = await albumsModel.save(album)
				expect(saved).toEqual([
					{
						...album,
						removedTrackIds: undefined,
						refs: [makeRef(artist1), makeRef(artist2)]
					}
				])
				expect((await albumsModel.list()).results).toEqual(
					expect.arrayContaining(saved)
				)
			})
		})

		describe('getByName()', () => {
			const name = faker.music.album()

			const album1: Album = {
				id: faker.number.int(),
				media: faker.image.url(),
				mediaCount: 0,
				mtimeMs: 0,
				name,
				trackIds: [tracks[0].id, tracks[3].id],
				refs: [makeRef(artist1), [1, null] as Reference],
				agentId: null
			}
			const album2: Album = {
				id: faker.number.int(),
				media: faker.image.url(),
				mediaCount: 0,
				mtimeMs: 0,
				name: faker.music.album(),
				trackIds: [tracks[1].id],
				refs: [makeRef(artist1), makeRef(artist2)],
				agentId: null
			}
			const album3: Album = {
				id: faker.number.int(),
				media: faker.image.url(),
				mediaCount: 0,
				mtimeMs: 0,
				name,
				trackIds: [tracks[2].id],
				refs: [makeRef(artist2)],
				agentId: null
			}

			beforeAll(async () => albumsModel.save([album1, album2, album3]))

			it('returns several albums by name', async () => {
				const results = await albumsModel.getByName(name)
				expect(results).toEqual(expect.arrayContaining([album1, album3]))
				expect(results).toHaveLength(2)
			})

			it('returns single album by name', async () => {
				expect(await albumsModel.getByName(album2.name)).toEqual([album2])
			})

			it('returns empty results on unknown name', async () => {
				expect(await albumsModel.getByName(faker.music.album())).toEqual([])
			})
		})
	}
)
