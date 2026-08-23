import type { Stats } from 'node:fs'
import { rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'
import { faker } from '@faker-js/faker'

import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { Playlist, Track } from '@melodie/common/models'
import chokidar from 'chokidar'
import type { FSWatcher } from 'chokidar'
import { makeFolder, makePlaylists } from '../tests/files.ts'
import { foldersService as service } from './folders.ts'

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
				mediaCount: 0,
				filePath: path
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

	describe('compare()', () => {
		it('fails on missing folders', async () => {
			await expect(service.compare([], base)).rejects.toThrow(
				'no folder to watch'
			)
		})

		it('dedupes children folders', async () => {
			expect(
				await service.compare(
					[
						dirname(tree.files[1].path),
						tree.folder,
						dirname(tree.files[12].path)
					],
					base
				)
			).toEqual([tree.folder])
		})

		it('saves agent in database', async () => {
			const base = faker.internet.url()
			await service.compare([tree.folder], base)
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

			await service.compare([tree.folder], base)

			const tracks = newFiles.map(({ path, stats: { mtimeMs, ino } }) => ({
				id: ino,
				path,
				relativePath: relative(tree.folder, path),
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

			await service.compare([tree.folder], base)

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
					filePath: expect.stringContaining('.m3u'),
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

			await service.compare([tree.folder], base)

			const tracks = modified.map(({ path, stats: { mtimeMs, ino } }) => ({
				id: ino,
				path,
				relativePath: relative(tree.folder, path),
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

			await service.compare([tree.folder], base)

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

			await service.compare([tree.folder], base)

			expect(tracksService.add).not.toHaveBeenCalled()
			expect(tracksService.remove).not.toHaveBeenCalled()
			expect(playlistsService.save).not.toHaveBeenCalled()
			expect(coversService.findInFolder).not.toHaveBeenCalled()
			expect(tagsService.read).not.toHaveBeenCalled()
			expect(playlistsService.read).not.toHaveBeenCalled()
		})
	})
})
