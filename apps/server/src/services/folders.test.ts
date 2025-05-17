import type { Stats } from 'node:fs'
import { mkdtemp, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, extname, join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { faker } from '@faker-js/faker'

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn
} from 'bun:test'
import chokidar from 'chokidar'
import type { FSWatcher } from 'chokidar'
import type { Playlist, Track } from '@melodie/common/models'
import { makeFolder, makePlaylists } from '../tests/files.ts'
import { foldersService as service } from './folders.ts'

const timeout = 700

const formats = ['.m3u', '.m3u8']
const coversService = { findInFolder: mock() }
const tagsService = { read: mock() }
const playlistsService = {
	read: mock(),
	save: mock(),
	checkIntegrity: mock(),
	isPlaylistFile(file: string) {
		return formats.includes(extname(file).toLowerCase())
	}
}
const tracksService = { add: mock(), remove: mock() }
const tracksModel = {
	listWithTime: mock(),
	getByPaths: mock<(paths: string[]) => Promise<Track[]>>()
}
const playlistsModel = { listWithTime: mock(), getById: mock() }
const agentsModel = { save: mock() }
const watch = mock()

mock.module('chokidar', () => ({ ...chokidar, watch }))
mock.module('@melodie/common/models', () => ({
	agentsModel,
	tracksModel,
	playlistsModel
}))
mock.module('./tracks.ts', () => ({ tracksService }))
// mocks to make test faster
mock.module('./covers.ts', () => ({ coversService }))
mock.module('./tags.ts', () => ({
	TagsService: { formats: ['.mp3', '.ogg', '.flac'] },
	tagsService
}))
mock.module('./playlists.ts', async () => ({
	PlaylistsService: { formats },
	playlistsService
}))

describe('Folders service', () => {
	let tree: Awaited<ReturnType<typeof makeFolder>>
	let statsByPlaylist = new Map<string, Stats>()
	const statsByPath = new Map<string, Stats>()
	let agentId = 1
	const base = faker.internet.url()
	let watcher: FSWatcher

	beforeEach(async () => {
		coversService.findInFolder.mockReset().mockResolvedValue(null)
		tagsService.read
			.mockReset()
			.mockResolvedValue({ artists: [], genre: [], duration: 0 })
		tracksService.add.mockReset().mockResolvedValue(void 0)
		tracksService.remove.mockReset().mockResolvedValue(void 0)
		playlistsService.save
			.mockReset()
			.mockImplementation(async p => (Array.isArray(p) ? p : [p]) as Playlist[])
		playlistsService.read.mockReset().mockImplementation(async path => {
			const { ino, mtimeMs } = await stat(path)
			return {
				id: ino,
				mtimeMs,
				name: basename(path).replace(extname(path), ''),
				trackIds: [],
				trackPaths: [],
				refs: [],
				media: null,
				mediaCount: 0
			}
		})
		statsByPath.clear()
		tree = await makeFolder({ depth: 3, fileNb: 15 })
		agentId = (await stat(tree.folder)).ino
		statsByPlaylist = await makePlaylists({ ...tree, playlistNb: 4 })
		for (const file of tree.files) {
			statsByPath.set(file.path, file.stats)
		}
		tracksModel.getByPaths.mockReset().mockImplementation(async paths =>
			paths
				.map(path => {
					const stats = statsByPath.get(path)
					return stats
						? {
								id: stats.ino,
								mtimeMs: stats.mtimeMs,
								path,
								tags: { artists: [], duration: 0, genre: [] },
								media: null,
								mediaCount: 0,
								artistRefs: [],
								albumRef: null,
								agentId
							}
						: null
				})
				.filter(result => result !== null)
		)
		tracksModel.listWithTime
			.mockReset()
			.mockImplementation(
				async () =>
					new Map(
						[...statsByPath.values()].map(({ ino, mtimeMs }) => [ino, mtimeMs])
					)
			)
		playlistsModel.listWithTime
			.mockReset()
			.mockImplementation(
				async () =>
					new Map(
						[...statsByPlaylist.entries()].map(([, { ino, mtimeMs }]) => [
							ino,
							mtimeMs
						])
					)
			)
		playlistsModel.getById.mockReset().mockResolvedValue(null)
		agentsModel.save.mockReset()
		watch.mockImplementation((paths, options) => {
			watcher = chokidar.watch(paths, options)
			return watcher
		})
	})

	afterEach(() => service.stopWatching())

	describe('watchAndCompare()', () => {
		it('fails on missing folders', async () => {
			await expect(service.watchAndCompare([], base)).rejects.toThrow(
				'no folder to watch'
			)
		})

		it('dedupes children folders', async () => {
			await service.watchAndCompare(
				[
					dirname(tree.files[1].path),
					tree.folder,
					dirname(tree.files[12].path)
				],
				base
			)
			expect(service.folders).toEqual([tree.folder])
		})

		it('saves agent in database', async () => {
			const base = faker.internet.url()
			await service.watchAndCompare([tree.folder], base)
			expect(agentsModel.save).toHaveBeenCalledWith({
				id: (await stat(tree.folder)).ino,
				name: 'local',
				base
			})
			expect(agentsModel.save).toHaveBeenCalledTimes(1)
		})

		it('saves new tracks', async () => {
			const newFiles = tree.files.slice(2, 6)
			for (const { path } of newFiles) {
				statsByPath.delete(path)
			}

			await service.watchAndCompare([tree.folder], base)

			const tracks = newFiles.map(({ path, stats: { mtimeMs, ino } }) => ({
				id: ino,
				path,
				tags: { artists: [], genre: [], duration: 0 },
				mtimeMs,
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			}))
			expect(tracksService.add).toHaveBeenCalledWith(
				expect.arrayContaining(tracks)
			)
			expect(tracksService.add).toHaveBeenCalledTimes(1)
			expect(tracksService.remove).not.toHaveBeenCalled()
			for (const { path } of newFiles) {
				expect(coversService.findInFolder).toHaveBeenCalledWith(path)
				expect(tagsService.read).toHaveBeenCalledWith(path)
			}
			expect(coversService.findInFolder).toHaveBeenCalledTimes(newFiles.length)
			expect(tagsService.read).toHaveBeenCalledTimes(newFiles.length)
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
		})

		it('saves new playlists', async () => {
			const path = join(dirname(tree.files[5].path), 'new.m3u')
			await writeFile(path, '#EXTM3U\ntest.mp3', 'latin1')

			await service.watchAndCompare([tree.folder], base)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.read).toHaveBeenCalledWith(path)
			expect(playlistsService.read).toHaveBeenCalledTimes(1)
			expect(playlistsService.save).toHaveBeenCalledWith(
				{
					id: expect.any(Number),
					mtimeMs: expect.any(Number),
					media: null,
					mediaCount: 0,
					name: 'new',
					refs: [],
					trackIds: [],
					trackPaths: []
				},
				true
			)
			expect(playlistsService.save).toHaveBeenCalledTimes(1)
		})

		it('saves modified tracks', async () => {
			const modified = tree.files.slice(4, 10)
			for (const { path } of modified) {
				// biome-ignore lint/style/noNonNullAssertion: the map contains these paths.
				const stats = statsByPath.get(path)!
				statsByPath.set(path, { ...stats, mtimeMs: Date.now() - 5e3 })
			}

			await service.watchAndCompare([tree.folder], base)

			const tracks = modified.map(({ path, stats: { mtimeMs, ino } }) => ({
				id: ino,
				path,
				tags: { artists: [], genre: [], duration: 0 },
				mtimeMs,
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			}))
			expect(tracksService.add).toHaveBeenCalledWith(
				expect.arrayContaining(tracks)
			)
			expect(tracksService.add).toHaveBeenCalledTimes(1)
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			for (const { path } of modified) {
				expect(coversService.findInFolder).toHaveBeenCalledWith(path)
				expect(tagsService.read).toHaveBeenCalledWith(path)
			}
			expect(coversService.findInFolder).toHaveBeenCalledTimes(modified.length)
			expect(tagsService.read).toHaveBeenCalledTimes(modified.length)
			expect(playlistsService.read).not.toHaveBeenCalled()
		})

		it('removes missing tracks', async () => {
			const missing = tree.files.slice(3, 7)
			for (const { path } of missing) {
				await rm(path)
			}
			statsByPlaylist.set(join(tree.folder, 'only-in-database.m3u'), {
				mtimeMs: Date.now() - 1,
				ino: faker.number.int()
			} as Stats)

			await service.watchAndCompare([tree.folder], base)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).toHaveBeenCalledWith(
				missing.map(({ stats }) => stats.ino)
			)
			expect(tracksService.remove).toHaveBeenCalledTimes(1)
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
		})

		it('ignores modifications and deletions of playlist files', async () => {
			const playlistPaths = [...statsByPlaylist.keys()]
			await rm(playlistPaths[0])
			await writeFile(playlistPaths[1], '#EXTM3U\ntest.mp3', 'latin1')

			await service.watchAndCompare([tree.folder], base)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
		})
	})

	describe('given watching in progress()', () => {
		let unhandledFiles: string[]

		beforeEach(async () => {
			unhandledFiles = [
				join(tree.folder, 'image.png'),
				join(dirname(tree.files[5].path), 'text.txt'),
				join(dirname(tree.files[10].path), 'code.js')
			]
			for (const path of unhandledFiles) {
				await writeFile(path, faker.word.noun())
			}
			await service.watchAndCompare([tree.folder], base)
			tracksService.add.mockClear()
			tracksService.remove.mockClear()
			coversService.findInFolder.mockClear()
			tagsService.read.mockClear()
			playlistsService.save.mockClear()
			playlistsService.read.mockClear()
			playlistsService.checkIntegrity.mockClear()
			await setTimeout(250)
		})

		afterEach(() => service.stopWatching())

		it('handles no modifications', async () => {
			await setTimeout(timeout)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('removes deleted tracks', async () => {
			const removed = tree.files.slice(3, 7)
			for (const { path } of removed) {
				const { ino, mtimeMs } = await stat(path)
				tracksModel.getByPaths.mockResolvedValueOnce([
					{
						id: ino,
						mtimeMs,
						path,
						tags: { artists: [], duration: 0, genre: [] },
						media: null,
						mediaCount: 0,
						artistRefs: [],
						albumRef: null,
						agentId
					}
				])
				await rm(path)
			}

			await setTimeout(timeout)

			expect(tracksService.remove).toHaveBeenCalledWith(
				removed.map(({ stats }) => stats.ino)
			)
			expect(tracksService.remove).toHaveBeenCalledTimes(1)
			expect(tracksService.add).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
		})

		it('saves new tracks', async () => {
			const first = join(tree.folder, 'first.mp3')
			const second = join(dirname(tree.files[5].path), 'second.ogg')
			const third = join(dirname(tree.files[10].path), 'third.flac')

			await Promise.all([
				writeFile(first, faker.word.noun()),
				writeFile(join(tree.folder, 'ignored.png'), faker.word.noun()),
				writeFile(second, faker.word.noun()),
				writeFile(join(tree.folder, 'ignored.jpg'), faker.word.noun()),
				writeFile(third, faker.word.noun())
			])

			await setTimeout(timeout)

			const tracks: Track[] = [first, second, third].map(path => ({
				id: expect.any(Number),
				mtimeMs: expect.any(Number),
				path,
				tags: { artists: [], duration: 0, genre: [] },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			}))

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).toHaveBeenCalledWith(
				expect.arrayContaining(tracks)
			)
			for (const { path } of tracks) {
				expect(coversService.findInFolder).toHaveBeenCalledWith(path)
				expect(tagsService.read).toHaveBeenCalledWith(path)
			}
			expect(coversService.findInFolder).toHaveBeenCalledTimes(tracks.length)
			expect(tagsService.read).toHaveBeenCalledTimes(tracks.length)
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('saves modified files', async () => {
			const modified = tree.files.slice(2, 6)
			for (const { path } of modified) {
				await writeFile(path, faker.word.noun())
			}

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).toHaveBeenCalledWith(
				expect.arrayContaining(
					modified.map(({ path }) => ({
						id: expect.any(Number),
						mtimeMs: expect.any(Number),
						path,
						tags: { artists: [], duration: 0, genre: [] },
						media: null,
						mediaCount: 0,
						artistRefs: [],
						albumRef: null,
						agentId
					}))
				)
			)
			for (const { path } of modified) {
				expect(coversService.findInFolder).toHaveBeenCalledWith(path)
				expect(tagsService.read).toHaveBeenCalledWith(path)
			}
			expect(coversService.findInFolder).toHaveBeenCalledTimes(modified.length)
			expect(tagsService.read).toHaveBeenCalledTimes(modified.length)
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('handles file rename', async () => {
			const { path } = tree.files[0]
			const { ino, mtimeMs } = await stat(path)
			tracksModel.getByPaths.mockResolvedValueOnce([
				{
					id: ino,
					mtimeMs,
					path,
					tags: { artists: [], duration: 0, genre: [] },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			])
			const name = basename(path)
			const newPath = path.replace(name, `renamed${extname(name)}`)
			await rename(path, newPath)

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).toHaveBeenCalledWith([
				{
					id: expect.any(Number),
					mtimeMs: expect.any(Number),
					path: newPath,
					tags: { artists: [], duration: 0, genre: [] },
					media: null,
					mediaCount: 0,
					artistRefs: [],
					albumRef: null,
					agentId
				}
			])
			expect(tracksService.add).toHaveBeenCalledTimes(1)
			expect(coversService.findInFolder).toHaveBeenCalledTimes(1)
			expect(tagsService.read).toHaveBeenCalledTimes(1)
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('handles folder rename', async () => {
			const folder = dirname(tree.files[12].path)
			const newPath = folder.replace(basename(folder), 'renamed')
			const modified = tree.files.filter(({ path }) => path.startsWith(folder))

			const tracks: Track[] = modified.map(({ path }) => ({
				id: expect.any(Number),
				mtimeMs: expect.any(Number),
				path: path.replace(folder, newPath),
				tags: { artists: [], duration: 0, genre: [] },
				media: null,
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId
			}))
			await rename(folder, newPath)

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			for (const { path } of tracks) {
				expect(coversService.findInFolder).toHaveBeenCalledWith(path)
				expect(tagsService.read).toHaveBeenCalledWith(path)
			}
			expect(tracksService.add).toHaveBeenCalledWith(
				expect.arrayContaining(tracks)
			)
			expect(coversService.findInFolder).toHaveBeenCalledTimes(tracks.length)
			expect(tagsService.read).toHaveBeenCalledTimes(tracks.length)
			// playlistService.save(), .read() and .checkIntegrity() may be called if the random renamed folder contains a playlist file
		})

		it('ignores unsupported files deletion', async () => {
			for (const path of unhandledFiles) {
				await rm(path)
			}

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('ignores unsupported files addition', async () => {
			const first = join(tree.folder, 'script.ts')
			const second = join(dirname(tree.files[5].path), 'header.h')

			await Promise.all([
				writeFile(first, faker.word.noun()),
				writeFile(second, faker.word.noun())
			])

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('ignores unsupported files changes', async () => {
			await Promise.all(
				unhandledFiles.map(path => writeFile(path, faker.word.noun()))
			)

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('ignores unsupported files renames', async () => {
			await Promise.all(unhandledFiles.map(path => rename(path, `${path}.bak`)))

			await setTimeout(timeout)

			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('can handle all changes at once', async () => {
			const removed = tree.files.slice(2, 5)
			const saved = tree.files
				.slice(8, 10)
				.map(({ path }) => path)
				.concat([
					join(dirname(tree.files[5].path), 'new-1.ogg'),
					join(dirname(tree.files[10].path), 'new-2.flac')
				])
			await Promise.all([
				...saved.map(path => writeFile(path, faker.word.noun())),
				...removed.map(({ path }) => rm(path))
			])

			await setTimeout(timeout)

			expect(tracksService.add).toHaveBeenCalledWith(
				expect.arrayContaining(
					saved.map(path => ({
						id: expect.any(Number),
						mtimeMs: expect.any(Number),
						path,
						tags: { artists: [], duration: 0, genre: [] },
						media: null,
						mediaCount: 0,
						artistRefs: [],
						albumRef: null,
						agentId
					}))
				)
			)
			expect(tracksService.add).toHaveBeenCalledTimes(1)
			expect(tracksService.remove).toHaveBeenCalledWith(
				expect.arrayContaining(removed.map(({ stats }) => stats.ino))
			)
			expect(tracksService.remove).toHaveBeenCalledTimes(1)
			for (const path of saved) {
				expect(coversService.findInFolder).toHaveBeenCalledWith(path)
				expect(tagsService.read).toHaveBeenCalledWith(path)
			}
			expect(coversService.findInFolder).toHaveBeenCalledTimes(saved.length)
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(tagsService.read).toHaveBeenCalledTimes(saved.length)
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
		})

		it('handles watcher errors', async () => {
			const error = new Error('Intentionaly triggered!!')
			const errorSpy = spyOn(service.logger, 'error')

			watcher?.emit('error', error)
			await setTimeout(100)

			expect(errorSpy).toHaveBeenCalledTimes(1)
			expect(errorSpy).toHaveBeenCalledWith({ error }, 'received watch error')
			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
		})

		it('finds additions of playlist files', async () => {
			const path = join(dirname(tree.files[2].path), 'new.m3u')
			await writeFile(path, '#EXTM3U\ntest.mp3', 'latin1')

			await setTimeout(timeout)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.save).toHaveBeenCalledWith(
				{
					id: expect.any(Number),
					mtimeMs: expect.any(Number),
					name: basename(path).replace('.m3u', ''),
					trackIds: [],
					trackPaths: [],
					media: null,
					mediaCount: 0,
					refs: []
				},
				true
			)
			expect(playlistsService.save).toHaveBeenCalledTimes(1)
			expect(playlistsService.read).toHaveBeenCalledWith(path)
			expect(playlistsService.read).toHaveBeenCalledTimes(1)
			expect(playlistsService.checkIntegrity).toHaveBeenCalledTimes(1)
		})

		it('ignores modifications and deletions of playlist files', async () => {
			playlistsModel.getById.mockImplementation(async id => {
				for (const [path, { ino, mtimeMs }] of statsByPlaylist) {
					if (ino === id) {
						return {
							id,
							mtimeMs,
							name: basename(path).replace(extname(path), ''),
							media: null,
							mediaCount: 0,
							refs: [],
							trackIds: []
						}
					}
				}
				return null
			})
			const playlistPaths = [...statsByPlaylist.keys()]
			await writeFile(playlistPaths[2], '#EXTM3U\ntest.mp3', 'latin1')
			await rm(playlistPaths[3], { force: true })

			await setTimeout(timeout)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
			expect(playlistsService.checkIntegrity).not.toHaveBeenCalled()
		})

		it('stops watching previous folder', async () => {
			statsByPath.clear()
			await service.watchAndCompare(
				[await mkdtemp(join(tmpdir(), 'melodie-'))],
				base
			)
			await setTimeout(250)

			writeFile(join(tree.folder, 'first.mp3'), faker.word.noun())

			await setTimeout(700)
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(tracksService.add).not.toHaveBeenCalled()
		})
	})
})
