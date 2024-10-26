import { faker } from '@faker-js/faker'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import { makeRef } from '../tests/refs.ts'
import type { DBConf, PartialWithReq } from '../types.ts'
import { type Artist, ArtistsModel, artistsModel } from './artists.ts'
import { type Track, tracksModel } from './tracks.ts'

describe.each([{ kind: 'pg' }, { kind: 'sqlite3' }])(
	'Artists model ($kind}',
	({ kind }) => {
		let conf: DBConf
		const album1 = faker.person.fullName()
		const album2 = faker.person.fullName()

		// use fixed ids for consistent ordering
		const tracks: PartialWithReq<Track, 'id' | 'tags'>[] = [
			{
				id: 1,
				path: '1',
				tags: { album: album1, artists: [], genre: [], duration: 0 }
			},
			{
				id: 2,
				path: '2',
				tags: { album: album1, artists: [], genre: [], duration: 0 }
			},
			{
				id: 3,
				path: '3',
				tags: { album: album2, artists: [], genre: [], duration: 0 }
			},
			{
				id: 4,
				path: '4',
				tags: { artists: [], genre: [], duration: 0 }
			}
		]

		beforeAll(async () => {
			conf = await initTestDB(kind as DBConf['kind'])
			await artistsModel.init(conf)
			await tracksModel.init(conf)
			tracksModel.save(tracks)
		})

		afterAll(async () => {
			await ArtistsModel.release()
			await cleanTestTB(conf)
		})

		describe('save()', () => {
			it('adds new artist with refs', async () => {
				const artist: PartialWithReq<Artist, 'id'> = {
					id: faker.number.int(),
					media: faker.image.url(),
					mtimeMs: 0,
					name: faker.music.artist(),
					trackIds: [tracks[0].id, tracks[3].id]
				}

				await artistsModel.save(artist)
				expect((await artistsModel.list()).results).toEqual([
					{
						...artist,
						bio: null,
						mediaCount: 0,
						refs: [makeRef(album1), [1, null]],
						agentId: null
					}
				])
			})

			it('updates existing artist with refs', async () => {
				const artist: PartialWithReq<Artist, 'id' | 'trackIds'> = {
					id: faker.number.int(),
					media: faker.image.url(),
					mediaCount: faker.number.int({ max: 10 }),
					mtimeMs: 0,
					name: faker.music.artist(),
					trackIds: [tracks[0].id, tracks[3].id],
					bio: { en: faker.lorem.words() }
				}

				expect((await artistsModel.save(artist)).saved).toEqual([
					{
						...artist,
						refs: [makeRef(album1), [1, null]]
					}
				])

				artist.removedTrackIds = artist.trackIds.concat()
				artist.trackIds = [tracks[1].id, tracks[2].id]

				const { saved } = await artistsModel.save(artist)
				expect(saved).toEqual([
					{
						...artist,
						removedTrackIds: undefined,
						refs: [makeRef(album1), makeRef(album2)],
						agentId: null
					}
				])
				expect((await artistsModel.list()).results).toEqual(
					expect.arrayContaining(saved)
				)
			})
		})
	}
)
