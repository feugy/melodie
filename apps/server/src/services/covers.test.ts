import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { platform, tmpdir } from 'node:os'
import { join } from 'node:path'
import { faker } from '@faker-js/faker'
import type { Album } from '@melodie/common/models'
import { hash } from '@melodie/common/utils'
import { coversService as service } from './covers.ts'

const tracksModel = { getById: mock() }

mock.module('@melodie/common/models', () => ({ tracksModel }))

describe('Cover service', () => {
	beforeEach(() => {
		tracksModel.getById.mockReset()
	})

	describe('findInFolder()', () => {
		let path: string

		beforeEach(async () => {
			path = await mkdtemp(join(tmpdir(), 'melodie-'))
		})

		it('returns null for cover-less path', async () => {
			expect(await service.findInFolder(join(path, 'file.mp3'))).toBeNull()
		})

		it('finds gif', async () => {
			const gif = join(path, 'folder.gif')
			await writeFile(gif, '')
			expect(await service.findInFolder(join(path, 'file.mp3'))).toEqual(gif)
		})

		it('finds png', async () => {
			const png = join(path, 'folder.png')
			await writeFile(png, '')
			expect(await service.findInFolder(join(path, 'file.mp3'))).toEqual(png)
		})

		it('finds jpeg', async () => {
			const jpeg = join(path, 'cover.jpeg')
			await writeFile(jpeg, '')
			expect(await service.findInFolder(join(path, 'file.mp3'))).toEqual(jpeg)
		})

		it('finds capitalized', async () => {
			const jpeg = join(path, 'Cover.jpeg')
			await writeFile(jpeg, '')

			expect(await service.findInFolder(join(path, 'file.mp3'))).toEqual(
				join(path, `${platform() === 'linux' ? 'Cover' : 'cover'}.jpeg`)
			)
		})

		describe('given cover.jpg', () => {
			let jpg: string

			beforeEach(async () => {
				jpg = join(path, 'cover.jpg')
				await writeFile(jpg, '')
			})

			it('finds it for a track', async () => {
				expect(await service.findInFolder(join(path, 'file.mp3'))).toEqual(jpg)
			})

			it('finds it for an album', async () => {
				expect(await service.findInFolder(path)).toEqual(jpg)
			})
		})
	})

	describe('findAlbumCover()', () => {
		const folder = join(tmpdir(), 'melodie', faker.string.uuid())
		const files = [
			join(folder, 'track1.mp3'),
			join(folder, 'track2.mp3'),
			join(folder, 'track3.mp3'),
			join(folder, 'track4.mp3')
		]

		beforeEach(async () => {
			await mkdir(folder, { recursive: true })
			for (const file of files) {
				await writeFile(file, '')
			}
		})

		afterEach(async () => {
			await rm(folder, { recursive: true, force: true })
		})

		it('returns all images inside folders', async () => {
			const covers = [
				join(
					folder,
					'AlbumArt_{62D46EC5-701B-40A3-B7A7-D66E1E29EECA}_Large.jpg'
				),
				join(folder, 'Folder.png'),
				join(folder, 'cover.jpeg')
			]
			const files = [
				join(folder, 'track1.mp3'),
				...covers,
				join(folder, 'readme.md')
			]
			for (const file of files) {
				await writeFile(file, '')
			}
			tracksModel.getById.mockResolvedValueOnce({
				id: hash(files[0]),
				mtimeMs: Date.now(),
				path: files[0],
				tags: { artists: [], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId: faker.number.int()
			})

			expect(
				await service.findForAlbum({
					trackIds: files.map(file => hash(file))
				} as unknown as Album)
			).toEqual(
				expect.arrayContaining(
					covers.map(cover => ({ cover, provider: 'Local' }))
				)
			)
			expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
			expect(tracksModel.getById).toHaveBeenCalledTimes(1)
		})

		it('returns nothing when folder does not contain images', async () => {
			tracksModel.getById.mockResolvedValueOnce({
				id: hash(files[0]),
				mtimeMs: Date.now(),
				path: files[0],
				tags: { artists: [], genre: [], duration: 0 },
				mediaCount: 0,
				artistRefs: [],
				albumRef: null,
				agentId: faker.number.int()
			})

			expect(
				await service.findForAlbum({
					trackIds: files.map(file => hash(file))
				} as unknown as Album)
			).toEqual([])
			expect(tracksModel.getById).toHaveBeenCalledWith(hash(files[0]))
			expect(tracksModel.getById).toHaveBeenCalledTimes(1)
		})
	})
})
