import { beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { mkdtemp, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { faker } from '@faker-js/faker'
import type { Playlist, Track } from '@melodie/common/models'
import { addId } from '@melodie/common/tests'
import type { PartialWithReq } from '@melodie/common/types'
import { playlistsService as service } from './playlists.ts'

const playlistsModel = { save: mock(), removeByIds: mock() }
const tracksModel = {
	getByIds: mock<(ids: number[]) => Promise<Track[]>>(),
	getByPaths: mock<(paths: string[]) => Promise<Track[]>>()
}

mock.module('@melodie/common/models', () => ({ playlistsModel, tracksModel }))

describe('Playlists service', () => {
	beforeEach(() => {
		playlistsModel.save.mockReset().mockImplementation(async playlist => {
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
		playlistsModel.removeByIds.mockReset().mockResolvedValue([])

		tracksModel.getByIds.mockReset().mockImplementation(async ids =>
			ids.filter(Boolean).map(id => ({
				id,
				mtimeMs: Date.now(),
				path: `${id}`,
				tags: { genre: [], artists: [], duration: 0 },
				media: null,
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

		const fixtures = resolve(import.meta.dir, '../../../fixtures')
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs: mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2, track3, track4],
					userIds: []
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs,
					trackIds: [0],
					trackPaths: [
						join(folder, '..', 'fixtures', 'track.mp3'),
						join(folder, 'file.ogg'),
						join(folder, 'nested', 'music.flac')
					],
					userIds: []
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2, track3, track4],
					userIds: []
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track3],
					userIds: []
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2],
					userIds: []
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track2],
					userIds: []
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
					media: null,
					mediaCount: 0,
					filePath: playlist,
					mtimeMs,
					trackIds: [0],
					trackPaths: [track1, track2],
					userIds: []
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
					await service.read(resolve(import.meta.dir, `unknown.${ext}`))
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
			expect(playlistsModel.save).toHaveBeenCalledTimes(1)
		})

		it('removes empty existing playlist', async () => {
			const playlist = addId({ name: faker.music.songName(), trackIds: [] })
			await service.save(playlist)

			expect(playlistsModel.save).toHaveBeenCalledWith(playlist)
			expect(playlistsModel.save).toHaveBeenCalledTimes(1)
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
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				},
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				},
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId: null
				},
				{
					mtimeMs: 0,
					tags: { duration: 0, genre: [], artists: [] },
					path: faker.system.filePath(),
					media: null,
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
					media: null,
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

		it('removes file-backed playlist with empty tracks via', async () => {
			const playlist = addId({
				name: faker.music.songName(),
				trackIds: [faker.number.int(), faker.number.int()],
				filePath: faker.system.filePath()
			})

			await service.save(playlist, true)
			playlistsModel.save.mockClear()

			tracksModel.getByIds.mockResolvedValueOnce([])

			await service.checkIntegrity()
			expect(playlistsModel.removeByIds).toHaveBeenCalledWith([playlist.id])
			expect(playlistsModel.save).not.toHaveBeenCalled()
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
					media: null,
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
			expect(tracksModel.getByIds).toHaveBeenCalledTimes(1)
			expect(playlistsModel.save).not.toHaveBeenCalled()

			await service.checkIntegrity()
			expect(tracksModel.getByIds).toHaveBeenCalledTimes(1)
			expect(playlistsModel.save).not.toHaveBeenCalled()
		})
	})
})
