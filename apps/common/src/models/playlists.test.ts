import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it
} from 'bun:test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { faker } from '@faker-js/faker'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import { makeRef } from '../tests/refs.ts'
import type { DBConf, PartialWithReq } from '../types.ts'
import { type Playlist, PlaylistModel, playlistsModel } from './playlists.ts'
import { type Track, tracksModel } from './tracks.ts'

describe('Playlists model', () => {
	let conf: DBConf
	const artist1 = faker.music.artist()
	const artist2 = faker.music.artist()
	const album1 = faker.music.album()
	const album2 = faker.music.album()

	// use fixed ids for consistent ordering
	const tracks: PartialWithReq<Track, 'id' | 'tags'>[] = [
		{
			id: 1,
			path: '1',
			tags: { artists: [artist1], album: album1, genre: [], duration: 0 }
		},
		{
			id: 2,
			path: '2',
			tags: {
				artists: [artist1, artist2],
				album: album2,
				genre: [],
				duration: 0
			}
		},
		{
			id: 3,
			path: '3',
			tags: { artists: [artist2], album: album1, genre: [], duration: 0 }
		},
		{
			id: 4,
			path: '4',
			tags: { artists: [], genre: [], duration: 0 }
		}
	]

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await playlistsModel.init(conf)
		await tracksModel.init(conf)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await PlaylistModel.release()
		await cleanTestTB(conf)
	})

	describe('save()', () => {
		it('adds new playlist', async () => {
			const playlist: PartialWithReq<Playlist, 'id'> = {
				id: faker.number.int(),
				media: faker.image.url(),
				mtimeMs: faker.date.recent().getTime(),
				name: faker.commerce.productName(),
				trackIds: [tracks[0].id, tracks[3].id]
			}

			await playlistsModel.save(playlist)
			expect((await playlistsModel.list()).results).toEqual([
				{
					...(playlist as Playlist),
					mediaCount: 0,
					refs: [makeRef(artist1), makeRef(album1), [1, null]],
					trackPaths: null as unknown as undefined,
					filePath: null,
					userIds: []
				}
			])
		})

		it('updates existing playlist with refs and overrides trackIds', async () => {
			const playlist: Playlist = {
				id: faker.number.int(),
				media: faker.image.url(),
				mediaCount: faker.number.int({ max: 10 }),
				mtimeMs: faker.date.recent().getTime(),
				name: faker.lorem.words(),
				trackIds: [tracks[0].id, tracks[3].id],
				refs: [],
				filePath: null,
				userIds: []
			}

			expect((await playlistsModel.save(playlist)).saved).toEqual([
				{
					...playlist,
					refs: [makeRef(artist1), makeRef(album1), [1, null]]
				}
			])

			playlist.trackIds = [tracks[1].id, tracks[2].id]

			const { saved } = await playlistsModel.save(playlist)
			expect(saved).toEqual([
				{
					...playlist,
					trackPaths: null,
					refs: [
						makeRef(artist1),
						makeRef(artist2),
						makeRef(album2),
						makeRef(album1)
					],
					userIds: []
				}
			])

			expect((await playlistsModel.list()).results).toEqual(
				expect.arrayContaining(saved)
			)
		})
	})

	describe('listWithId()', () => {
		const playlists: PartialWithReq<Playlist, 'id' | 'mtimeMs'>[] = Array.from(
			{ length: 2 },
			() => ({
				id: faker.number.int(),
				mtimeMs: faker.date.recent().getTime(),
				name: faker.music.songName(),
				trackIds: [tracks[0].id]
			})
		)

		beforeEach(async () => playlistsModel.save(playlists))

		afterEach(async () => {
			await playlistsModel.reset()
		})

		it('returns all available ids', async () => {
			const timesByIno = await playlistsModel.listWithTime()
			for (const { id, mtimeMs } of playlists) {
				expect(timesByIno.get(id)).toEqual(mtimeMs)
			}
		})
	})

	describe('removeByIds()', () => {
		let folder: string

		beforeAll(async () => {
			folder = await mkdtemp(join(tmpdir(), 'melodie-playlists-'))
		})

		it('removes playlist from database', async () => {
			const playlist: Playlist = {
				id: faker.number.int(),
				media: null,
				mediaCount: 0,
				mtimeMs: Date.now(),
				name: faker.music.songName(),
				trackIds: [tracks[0].id],
				refs: [],
				filePath: null,
				userIds: []
			}
			await playlistsModel.save(playlist)
			expect(await playlistsModel.getById(playlist.id)).not.toBeNull()

			const removed = await playlistsModel.removeByIds([playlist.id])
			expect(removed).toHaveLength(1)
			expect(removed[0].id).toEqual(playlist.id)
			expect(await playlistsModel.getById(playlist.id)).toBeNull()
		})

		it('deletes file on disk when filePath is set', async () => {
			const filePath = join(folder, `${faker.string.uuid()}.m3u`)
			await writeFile(filePath, '#EXTM3U\n')
			const playlist: Playlist = {
				id: faker.number.int(),
				media: null,
				mediaCount: 0,
				mtimeMs: Date.now(),
				name: faker.music.songName(),
				trackIds: [tracks[0].id],
				refs: [],
				filePath,
				userIds: []
			}
			await playlistsModel.save(playlist)

			await playlistsModel.removeByIds([playlist.id])

			await expect(readFile(filePath)).rejects.toThrow()
		})

		it('ignores missing file when filePath is set', async () => {
			const filePath = join(folder, `${faker.string.uuid()}.m3u`)
			const playlist: Playlist = {
				id: faker.number.int(),
				media: null,
				mediaCount: 0,
				mtimeMs: Date.now(),
				name: faker.music.songName(),
				trackIds: [tracks[0].id],
				refs: [],
				filePath,
				userIds: []
			}
			await playlistsModel.save(playlist)

			const removed = await playlistsModel.removeByIds([playlist.id])
			expect(removed).toHaveLength(1)
			expect(await playlistsModel.getById(playlist.id)).toBeNull()
		})

		it('does not throw when filePath is null', async () => {
			const playlist: Playlist = {
				id: faker.number.int(),
				media: null,
				mediaCount: 0,
				mtimeMs: Date.now(),
				name: faker.music.songName(),
				trackIds: [tracks[0].id],
				refs: [],
				filePath: null,
				userIds: []
			}
			await playlistsModel.save(playlist)

			const removed = await playlistsModel.removeByIds([playlist.id])
			expect(removed).toHaveLength(1)
			expect(await playlistsModel.getById(playlist.id)).toBeNull()
		})
	})
})
