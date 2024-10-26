import { mkdtemp, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { faker } from '@faker-js/faker'
import * as services from '@melodie/common/models'
import type { Playlist, Track } from '@melodie/common/models'
import { addId } from '@melodie/common/tests'
import type { PartialWithReq } from '@melodie/common/types'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { playlistsService as service } from './playlists.ts'

vi.mock('@melodie/common/models')

const playlistsModel = vi.mocked(services.playlistsModel)
const tracksModel = vi.mocked(services.tracksModel)

describe('Playlists service', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		playlistsModel.save.mockImplementation(async playlist => {
			const saved: Playlist[] = []
			const removedIds: number[] = []
			for (const data of Array.isArray(playlist) ? playlist : [playlist]) {
				if (data.trackIds?.length) {
					saved.push(data as Playlist)
				} else {
					removedIds.push(data.id)
				}
			}
			return { saved, removedIds }
		})

		tracksModel.getByIds.mockImplementation(async ids =>
			ids.filter(Boolean).map(id => ({
				id,
				mtimeMs: Date.now(),
				path: `${id}`,
				tags: { genre: [], artists: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId: null
			}))
		)
	})

	describe('isPlaylistFile()', () => {
		it.each([
			[true, faker.system.fileName().replace(/\..+$/, '.m3u')],
			[true, faker.system.fileName().replace(/\..+$/, '.m3u8')],
			[false, faker.system.fileName().replace(/\..+$/, '.mp3')],
			[false, faker.system.fileName().replace(/\..+$/, '.ogg')],
			[false, faker.system.fileName().replace(/\..+$/, '.txt')]
		])('returns %s for file %s', (match, file) => {
			expect(service.isPlaylistFile(file)).toEqual(match)
		})
	})

	describe('read()', () => {
		let folder: string

		const fixtures = resolve(__dirname, '../../../fixtures')
		const album =
			sep +
			join(
				'home',
				'damien',
				'Musique',
				'Norah Jones',
				'(2002) Come Away With Me'
			)
		const track1 = resolve(album, "01 - Norah Jones - Don't Know Why.ogg")
		const track2 = resolve(album, '02 - Norah Jones - Seven Years.ogg')
		const track3 = resolve(fixtures, 'file.flac')
		const track4 = resolve(fixtures, 'file.ogg')

		beforeAll(async () => {
			folder = await mkdtemp(join(tmpdir(), 'melodie-'))
		})

		describe.each([
			['m3u', 'latin1'],
			['m3u8', 'utf8']
		] as [string, BufferEncoding][])('given %s files', (ext, encoding) => {
			it('reads absoluve urls', async () => {
				const name = 'absolutes'
				const playlist = join(folder, `${name}.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
${track1}
${track2}
${track3}
${track4}`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs: mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2, track3, track4]
				})
			})

			it('reads relative urls', async () => {
				const name = 'relatives'
				const playlist = join(folder, `${name}.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
${join('..', 'fixtures', 'track.mp3')}
file.ogg
${join('nested', 'music.flac')}`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs,
					trackIds: [0],
					trackPaths: [
						join(folder, '..', 'fixtures', 'track.mp3'),
						join(folder, 'file.ogg'),
						join(folder, 'nested', 'music.flac')
					]
				})
			})

			it('reads file urls', async () => {
				const name = 'file-protocol'
				const playlist = join(folder, `${name}.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
file://${encodeURI(track1)}
file://${encodeURI(track2)}
file://${encodeURI(track3)}
file://${encodeURI(track4)}`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2, track3, track4]
				})
			})

			it('reads playlist name', async () => {
				const name = faker.commerce.productName()
				const playlist = join(folder, `named.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
${track1}
#PLAYLIST: ${name}
${track3}`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track3]
				})
			})

			it('ignores nested playlists', async () => {
				const name = 'nested'
				const playlist = join(folder, `${name}.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
${track1}
nested.${ext}
${track2}`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2]
				})
			})

			it('ignores folders', async () => {
				const name = 'folders'
				const playlist = join(folder, `${name}.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
${folder}
${fixtures}
nested
${track2}
`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track2]
				})
			})

			it('ignores web urls', async () => {
				const name = 'urls'
				const playlist = join(folder, `${name}.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
file://${encodeURI(track1)}
http://example.com/track.mp3
${track2}
https://example.com/track.ogg
`,
					{ encoding }
				)
				const { ino, mtimeMs } = await stat(playlist)

				expect(await service.read(playlist)).toEqual({
					id: ino,
					name,
					refs: [],
					mediaCount: 0,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2]
				})
			})

			it('ignores empty m3u file', async () => {
				const playlist = join(folder, `empty.${ext}`)
				await writeFile(
					playlist,
					`#EXTM3U
# ${track1}


# ${track2}
`,
					{ encoding }
				)

				expect(await service.read(playlist)).toBeNull()
			})

			it('handles unknown file', async () => {
				expect(
					await service.read(resolve(__dirname, `unknown.${ext}`))
				).toBeNull()
			})
		})
	})

	describe('save()', () => {
		it('creates a new playlist', async () => {
			const playlist = addId({
				name: faker.music.songName(),
				desc: faker.lorem.paragraph(),
				trackIds: [faker.number.int(), faker.number.int()]
			})
			await service.save(playlist)

			expect(playlistsModel.save).toHaveBeenCalledWith(playlist)
			expect(playlistsModel.save).toHaveBeenCalledOnce()
		})

		it('removes empty existing playlist', async () => {
			const playlist = addId({ name: faker.music.songName(), trackIds: [] })
			await service.save(playlist)

			expect(playlistsModel.save).toHaveBeenCalledWith(playlist)
			expect(playlistsModel.save).toHaveBeenCalledOnce()
		})
	})

	describe('checkIntegrity()', () => {
		it('does nothing without marked playlists', async () => {
			await service.checkIntegrity()
			expect(tracksModel.getByIds).not.toHaveBeenCalled()
			expect(playlistsModel.save).not.toHaveBeenCalled()
		})

		it('checks and ignores valid playlists', async () => {
			const playlists: PartialWithReq<Playlist, 'id' | 'trackIds'>[] = [
				{
					name: faker.music.songName(),
					trackIds: [faker.number.int(), faker.number.int()]
				},
				{
					name: faker.music.songName(),
					trackIds: [faker.number.int(), faker.number.int()]
				}
			].map(addId)

			for (const playlist of playlists) {
				await service.save(playlist, true)
			}
			playlistsModel.save.mockClear()

			await service.checkIntegrity()
			for (const playlist of playlists) {
				expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
			}
			expect(tracksModel.getByIds).toHaveBeenCalledTimes(playlists.length)
			expect(playlistsModel.save).not.toHaveBeenCalled()
		})

		it('resolves and clears track paths', async () => {
			const tracks: Track[] = [
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				},
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				},
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				},
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				}
			].map(addId)
			tracksModel.getByPaths.mockImplementation(async paths =>
				paths
					.map(path => tracks.find(track => track.path === path))
					.filter(n => n !== undefined)
			)

			const playlists: PartialWithReq<Playlist, 'id' | 'trackPaths'>[] = [
				{
					name: faker.music.songName(),
					trackIds: [0],
					trackPaths: tracks.slice(0, 2).map(({ path }) => path)
				},
				{
					name: faker.music.songName(),
					trackIds: [0],
					trackPaths: tracks.slice(2).map(({ path }) => path)
				}
			].map(addId)

			for (const playlist of playlists) {
				await service.save(playlist, true)
			}
			playlistsModel.save.mockClear()

			await service.checkIntegrity()
			expect(playlistsModel.save).toHaveBeenCalledWith({
				...playlists[0],
				trackIds: tracks.slice(0, 2).map(({ id }) => id),
				trackPaths: undefined
			})
			expect(playlistsModel.save).toHaveBeenCalledWith({
				...playlists[1],
				trackIds: tracks.slice(2).map(({ id }) => id),
				trackPaths: undefined
			})
			expect(playlistsModel.save).toHaveBeenCalledTimes(2)
		})

		it('checks and saves invalid playlists', async () => {
			const playlists: PartialWithReq<Playlist, 'id' | 'trackIds'>[] = [
				{
					name: faker.music.songName(),
					trackIds: [faker.number.int(), faker.number.int()]
				},
				{
					name: faker.music.songName(),
					trackIds: [faker.number.int(), faker.number.int()]
				},
				{
					name: faker.music.songName(),
					trackIds: [faker.number.int(), faker.number.int()]
				}
			].map(addId)

			for (const playlist of playlists) {
				await service.save(playlist, true)
			}
			playlistsModel.save.mockClear()

			tracksModel.getByIds.mockResolvedValueOnce([]).mockResolvedValueOnce(
				playlists[1].trackIds.slice(1).map(id => ({
					id,
					mtimeMs: 0,
					path: `${id}`,
					tags: { genre: [], artists: [], duration: 0 },
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				}))
			)

			await service.checkIntegrity()
			expect(tracksModel.getByIds).toHaveBeenCalledTimes(playlists.length)
			expect(playlistsModel.save).toHaveBeenCalledWith({
				...playlists[0],
				trackIds: [],
				trackPaths: undefined
			})
			expect(playlistsModel.save).toHaveBeenCalledWith({
				...playlists[1],
				trackIds: playlists[1].trackIds.slice(1),
				trackPaths: undefined
			})
			expect(playlistsModel.save).toHaveBeenCalledTimes(2)
		})

		it('clears the list of playlists marked for checking', async () => {
			const playlist = addId({
				name: faker.music.songName(),
				trackIds: [faker.number.int(), faker.number.int()]
			})
			tracksModel.getByIds.mockResolvedValueOnce(
				playlist.trackIds.map(id => ({
					id,
					mtimeMs: 0,
					path: `${id}`,
					tags: { genre: [], artists: [], duration: 0 },
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				}))
			)

			await service.save(playlist, true)
			playlistsModel.save.mockClear()

			await service.checkIntegrity()
			expect(tracksModel.getByIds).toHaveBeenCalledWith(playlist.trackIds)
			expect(tracksModel.getByIds).toHaveBeenCalledOnce()
			expect(playlistsModel.save).not.toHaveBeenCalled()

			await service.checkIntegrity()
			expect(tracksModel.getByIds).toHaveBeenCalledOnce()
			expect(playlistsModel.save).not.toHaveBeenCalled()
		})
	})
})
