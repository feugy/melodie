import { access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { faker } from '@faker-js/faker'
import * as models from '@melodie/common/models'
import type { Album, Artist, Track } from '@melodie/common/models'
import { got } from 'got'
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi
} from 'vitest'
import { findPort } from '../tests/network.ts'
import { assetsService as service } from './assets.ts'

vi.mock('@melodie/common/models', () => ({
	albumsModel: { getById: vi.fn() },
	artistsModel: { getById: vi.fn() },
	tracksModel: { getById: vi.fn() }
}))

const albumsModel = vi.mocked(models.albumsModel)
const artistsModel = vi.mocked(models.artistsModel)
const tracksModel = vi.mocked(models.tracksModel)

describe('assets service', () => {
	const mp3 = resolve(__dirname, '../../../../fixtures/file.mp3')
	const cover = resolve(__dirname, '../../../../fixtures/cover.jpg')
	const avatar = resolve(__dirname, '../../../../fixtures/avatar.jpg')
	const imageFolder = resolve(tmpdir(), `melodie-${Date.now()}`)
	let address: string

	const album: Album = {
		id: faker.number.int({ min: 1000 }),
		name: faker.music.album(),
		trackIds: [],
		refs: [],
		mtimeMs: 0,
		media: cover,
		mediaCount: faker.number.int({ min: 1, max: 10 }),
		agentId: faker.number.int()
	}

	const artist: Artist = {
		id: faker.number.int({ min: 1000 }),
		name: faker.music.artist(),
		trackIds: [],
		refs: [],
		mtimeMs: 0,
		media: avatar,
		mediaCount: faker.number.int({ min: 1, max: 10 }),
		agentId: faker.number.int()
	}

	const track: Track = {
		id: faker.number.int({ min: 1000 }),
		path: mp3,
		tags: { genre: [], artists: [], duration: 0 },
		artistRefs: [],
		albumRef: null,
		mtimeMs: 0,
		media: cover,
		mediaCount: faker.number.int({ min: 1, max: 10 }),
		agentId: faker.number.int()
	}

	beforeAll(async () => {
		address = await service.start({ port: await findPort(), imageFolder })
	})

	afterAll(async () => service.stop())

	beforeEach(() => {
		vi.clearAllMocks()
	})

	type TestCase = {
		title: string
		path: string
		headers: Record<string, unknown>
	} & (
		| { model: typeof tracksModel; data: models.Track }
		| { model: typeof albumsModel; data: models.Album }
		| { model: typeof artistsModel; data: models.Artist }
	)

	describe.each<TestCase>([
		{
			title: 'album cover',
			path: 'albums',
			model: albumsModel,
			data: album,
			headers: {
				'content-type': 'image/jpeg',
				'content-length': '172447'
			}
		},
		{
			title: 'artist avatar',
			path: 'artists',
			model: artistsModel,
			data: artist,
			headers: {
				'content-type': 'image/jpeg',
				'content-length': '19790'
			}
		},
		{
			title: 'track cover',
			path: 'tracks',
			model: tracksModel,
			data: track,
			headers: {
				'content-type': 'image/jpeg',
				'content-length': '172447'
			}
		}
	])('$title', ({ title, path, model, data, headers }) => {
		it(`serves ${title}`, async () => {
			model.getById.mockResolvedValueOnce(data as unknown as null)
			const response = await got.get(
				`${address}/${path}/${data.id}/media/${data.mediaCount}`
			)
			expect(response.statusCode).toEqual(200)
			expect(response.headers).toEqual(
				expect.objectContaining({ etag: expect.any(String), ...headers })
			)
			expect(model.getById).toHaveBeenCalledWith(data.id)
			expect(model.getById).toHaveBeenCalledOnce()
		})

		it(`resizes ${title}`, async () => {
			const width = 200
			const height = 300
			const fileName = join(
				imageFolder,
				`${data.id}-${data.mediaCount}-${width}x${height}.avif`
			)
			await expect(access(fileName)).rejects.toThrow()
			model.getById.mockResolvedValueOnce(data as unknown as null)
			const response = await got.get(
				`${address}/${path}/${data.id}/media/${data.mediaCount}?w=${width}&h=${height}`
			)
			expect(response.statusCode).toEqual(200)
			expect(response.headers).toEqual(
				expect.objectContaining({
					etag: expect.any(String),
					'content-type': 'image/avif'
				})
			)
			await expect(access(fileName)).resolves.toBeUndefined()
			expect(model.getById).toHaveBeenCalledWith(data.id)
			expect(model.getById).toHaveBeenCalledOnce()
		})

		it(`resizes and converts ${title} to webp`, async () => {
			const width = 150
			const height = 75
			const format = 'image/webp'
			const fileName = join(
				imageFolder,
				`${data.id}-${data.mediaCount}-${width}x${height}.${format.replace('image/', '')}`
			)
			await expect(access(fileName)).rejects.toThrow()
			model.getById.mockResolvedValueOnce(data as unknown as null)
			const url = new URL(
				`${address}/${path}/${data.id}/media/${data.mediaCount}`
			)
			url.searchParams.set('w', `${width}`)
			url.searchParams.set('h', `${height}`)
			url.searchParams.set('f', format)
			const response = await got.get(url)
			expect(response.statusCode).toEqual(200)
			expect(response.headers).toEqual(
				expect.objectContaining({
					etag: expect.any(String),
					'content-type': format
				})
			)
			await expect(access(fileName)).resolves.toBeUndefined()
			expect(model.getById).toHaveBeenCalledWith(data.id)
			expect(model.getById).toHaveBeenCalledOnce()
		})

		it(`returns 404 for ${title} with invalid count`, async () => {
			model.getById.mockResolvedValueOnce(data as unknown as null)
			await expect(
				got.get(`${address}/${path}/${data.id}/media/${data.mediaCount + 1}`)
			).rejects.toThrow(/Not Found/)
			expect(model.getById).toHaveBeenCalledWith(data.id)
			expect(model.getById).toHaveBeenCalledOnce()
		})

		it(`returns 404 for unknown ${title}`, async () => {
			const id = faker.number.int({ min: 1000 })
			const mediaCount = faker.number.int({ min: 1, max: 10 })
			model.getById.mockResolvedValueOnce(null)
			await expect(
				got.get(`${address}/${path}/${id}/media/${mediaCount}`)
			).rejects.toThrow(/Not Found/)
			expect(model.getById).toHaveBeenCalledWith(id)
			expect(model.getById).toHaveBeenCalledOnce()
		})
	})

	it('serves track data', async () => {
		tracksModel.getById.mockResolvedValueOnce(track)
		const response = await got.get(`${address}/tracks/${track.id}/data`)
		expect(response.statusCode).toEqual(200)
		expect(response.headers).toEqual(
			expect.objectContaining({
				etag: expect.any(String),
				'content-type': 'audio/mpeg',
				'content-length': '169984'
			})
		)
		expect(tracksModel.getById).toHaveBeenCalledWith(track.id)
		expect(tracksModel.getById).toHaveBeenCalledOnce()
		expect(albumsModel.getById).not.toHaveBeenCalled()
		expect(artistsModel.getById).not.toHaveBeenCalled()
	})

	it('returns 404 for unknown tracks data', async () => {
		const id = faker.number.int({ min: 1000 })
		await expect(got.get(`${address}/tracks/${id}/data`)).rejects.toThrow(
			/Not Found/
		)
		expect(tracksModel.getById).toHaveBeenCalledWith(id)
		expect(tracksModel.getById).toHaveBeenCalledOnce()
		expect(albumsModel.getById).not.toHaveBeenCalled()
		expect(artistsModel.getById).not.toHaveBeenCalled()
	})
})
