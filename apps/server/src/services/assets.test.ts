import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
import { access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import type { Album, Artist, Track } from '@melodie/common/models'
import type { DBConf } from '@melodie/common/types'
import { hash } from '@melodie/common/utils'
import { findPort } from '../tests/network.ts'
import { assetsService as service } from './assets.ts'

const albumsModel = { getById: mock() }
const artistsModel = { getById: mock() }
const tracksModel = { getById: mock() }
const open = mock()
const init = mock()

mock.module('@melodie/common/models', () => ({
	albumsModel,
	artistsModel,
	tracksModel,
	init
}))
mock.module('open', () => ({ default: open }))
mock.module('web', () => ({
	handler: mock(
		(
			_req: unknown,
			res: {
				writeHead: (code: number, headers: Record<string, string>) => void
				end: () => void
			}
		) => {
			res.writeHead(200, {
				'content-type': 'text/html',
				'x-sveltekit-page': 'true'
			})
			res.end()
		}
	)
}))

describe('assets service', () => {
	const mp3 = resolve(import.meta.dir, '../../../../fixtures/file.mp3')
	const cover = resolve(import.meta.dir, '../../../../fixtures/cover.jpg')
	const avatar = resolve(import.meta.dir, '../../../../fixtures/avatar.jpg')
	const db = resolve(import.meta.dir, '../../../../fixtures/.empty.db.sqlite3')
	const imageFolder = resolve(tmpdir(), `melodie-${Date.now()}`)
	let address: string
	const database: DBConf = { filename: '../../fixtures/.empty.db.sqlite3' }

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
		bio: null,
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

	beforeEach(() => {
		mock.restore()
	})

	it('opens browser upon start', async () => {
		process.env.DB_FILENAME = db
		const url = await service.start({
			port: await findPort(),
			imageFolder,
			openUI: true,
			database
		})
		expect(open).toHaveBeenCalledWith(`${url}/web`)
		expect(open).toHaveBeenCalledTimes(1)
	})

	describe('base url computation', () => {
		let previousEnv: string | undefined

		beforeEach(() => {
			previousEnv = Bun.env.NODE_ENV
		})

		afterEach(() => {
			Bun.env.NODE_ENV = previousEnv
		})

		it('uses localhost in dev mode', async () => {
			Bun.env.NODE_ENV = 'development'
			const port = await findPort()
			expect(
				await service.start({ port, imageFolder, openUI: false, database })
			).toBe(`http://localhost:${port}`)
		})

		it('uses resolved address in production mode', async () => {
			Bun.env.NODE_ENV = 'production'
			const port = await findPort()
			expect(
				await service.start({ port, imageFolder, openUI: false, database })
			).toBe(`http://127.0.0.1:${port}`)
		})
	})

	describe('given a started server', () => {
		let auth: { headers: Record<string, string> }
		let validToken: string

		beforeAll(async () => {
			process.env.DB_FILENAME = db
			const { usersModel, settingsModel } = await import(
				'@melodie/common/models'
			)
			await usersModel.init({ filename: db })
			await settingsModel.init({ filename: db })
			const { createJWT } = await import('@melodie/common/utils')
			validToken = await createJWT({ userId: 1 })
			auth = { headers: { Authorization: `Bearer ${validToken}` } }
			address = await service.start({
				port: await findPort(),
				imageFolder,
				openUI: false,
				database
			})
		})

		afterAll(async () => service.stop())

		type TestCase = {
			title: string
			path: string
			headers: Record<string, unknown>
		} & (
			| { model: typeof tracksModel; data: Track }
			| { model: typeof albumsModel; data: Album }
			| { model: typeof artistsModel; data: Artist }
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
			beforeEach(() => {
				model.getById.mockClear()
			})

			it(`serves ${title}`, async () => {
				model.getById.mockResolvedValueOnce(data as unknown as null)
				const response = await fetch(
					`${address}/${path}/${data.id}/media/${data.mediaCount}`,
					auth
				)
				expect(response.status).toEqual(200)
				expect(
					Object.fromEntries(response.headers as unknown as [string, string][])
				).toEqual(
					expect.objectContaining({ etag: expect.any(String), ...headers })
				)
				expect(model.getById).toHaveBeenCalledWith(data.id)
				expect(model.getById).toHaveBeenCalledTimes(1)
			})

			it(`resizes ${title}`, async () => {
				const width = 200
				const height = 300
				const fileName = join(
					imageFolder,
					`${hash(data.media ?? '')}-${width}x${height}.avif`
				)
				await rm(fileName, { force: true })
				model.getById.mockResolvedValueOnce(data as unknown as null)
				const response = await fetch(
					`${address}/${path}/${data.id}/media/${data.mediaCount}?w=${width}&h=${height}`,
					auth
				)
				expect(response.status).toEqual(200)
				expect(getHeaders(response)).toEqual(
					expect.objectContaining({
						etag: expect.any(String),
						'content-type': 'image/avif'
					})
				)
				await expect(access(fileName)).resolves.toBeNull()
				expect(model.getById).toHaveBeenCalledWith(data.id)
				expect(model.getById).toHaveBeenCalledTimes(1)
			})

			it(`resizes and converts ${title} to webp`, async () => {
				const width = 150
				const height = 75
				const format = 'image/webp'
				const fileName = join(
					imageFolder,
					`${hash(data.media ?? '')}-${width}x${height}.${format.replace('image/', '')}`
				)
				await rm(fileName, { force: true })
				model.getById.mockResolvedValueOnce(data as unknown as null)
				const url = new URL(
					`${address}/${path}/${data.id}/media/${data.mediaCount}`
				)
				url.searchParams.set('w', `${width}`)
				url.searchParams.set('h', `${height}`)
				url.searchParams.set('f', format)
				const response = await fetch(url, auth)
				expect(response.status).toEqual(200)
				expect(getHeaders(response)).toEqual(
					expect.objectContaining({
						etag: expect.any(String),
						'content-type': format
					})
				)
				await expect(access(fileName)).resolves.toBeNull()
				expect(model.getById).toHaveBeenCalledWith(data.id)
				expect(model.getById).toHaveBeenCalledTimes(1)
			})

			it(`returns 404 for ${title} with invalid count`, async () => {
				model.getById.mockResolvedValueOnce(data as unknown as null)
				expect(
					await fetch(
						`${address}/${path}/${data.id}/media/${data.mediaCount + 1}`,
						auth
					)
				).toHaveProperty('status', 404)
				expect(model.getById).toHaveBeenCalledWith(data.id)
				expect(model.getById).toHaveBeenCalledTimes(1)
			})

			it(`returns 404 for unknown ${title}`, async () => {
				const id = faker.number.int({ min: 1000 })
				const mediaCount = faker.number.int({ min: 1, max: 10 })
				model.getById.mockResolvedValueOnce(null)
				expect(
					await fetch(`${address}/${path}/${id}/media/${mediaCount}`, auth)
				).toHaveProperty('status', 404)
				expect(model.getById).toHaveBeenCalledWith(id)
				expect(model.getById).toHaveBeenCalledTimes(1)
			})

			it('rejects without token', async () => {
				expect(
					await fetch(`${address}/${path}/${data.id}/media/${data.mediaCount}`)
				).toHaveProperty('status', 401)
			})

			it('rejects with invalid token', async () => {
				expect(
					await fetch(
						`${address}/${path}/${data.id}/media/${data.mediaCount}`,
						{
							headers: { Authorization: 'Bearer invalid.token.here' }
						}
					)
				).toHaveProperty('status', 401)
			})
		})

		it('serves track data', async () => {
			tracksModel.getById.mockClear()
			albumsModel.getById.mockClear()
			artistsModel.getById.mockClear()
			tracksModel.getById.mockResolvedValueOnce(track)
			const response = await fetch(`${address}/tracks/${track.id}/data`, auth)
			expect(response.status).toEqual(200)
			expect(getHeaders(response)).toEqual(
				expect.objectContaining({
					etag: expect.any(String),
					'content-type': 'audio/mpeg',
					'content-length': '169984'
				})
			)
			expect(tracksModel.getById).toHaveBeenCalledWith(track.id)
			expect(tracksModel.getById).toHaveBeenCalledTimes(1)
			expect(albumsModel.getById).not.toHaveBeenCalled()
			expect(artistsModel.getById).not.toHaveBeenCalled()
		})

		it('returns 404 for unknown tracks data', async () => {
			tracksModel.getById.mockClear()
			albumsModel.getById.mockClear()
			artistsModel.getById.mockClear()
			const id = faker.number.int({ min: 1000 })
			expect(await fetch(`${address}/tracks/${id}/data`, auth)).toHaveProperty(
				'status',
				404
			)
			expect(tracksModel.getById).toHaveBeenCalledWith(id)
			expect(tracksModel.getById).toHaveBeenCalledTimes(1)
			expect(albumsModel.getById).not.toHaveBeenCalled()
			expect(artistsModel.getById).not.toHaveBeenCalled()
		})

		it('serves Web UI', async () => {
			const response = await fetch(`${address}/web`)
			expect(response.status).toEqual(200)
			expect(getHeaders(response)).toEqual(
				expect.objectContaining({
					'content-type': 'text/html',
					'x-sveltekit-page': 'true'
				})
			)
		})
	})
})

function getHeaders(
	response: Response
): Record<string, string | number | boolean> {
	return Object.fromEntries(
		response.headers as unknown as [string, string | number | boolean][]
	)
}
