import { access, mkdir } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { basename, dirname, join, resolve } from 'node:path'
import compressPlugin from '@fastify/compress'
import corsPlugin from '@fastify/cors'
import staticPlugin from '@fastify/static'
import {
	type AbstractModel,
	albumsModel,
	artistsModel,
	tracksModel
} from '@melodie/common/models'
import { type Logger, getLogger } from '@melodie/common/utils'
import { type FastifyBaseLogger, type FastifyInstance, fastify } from 'fastify'
import ms from 'ms'
import { publicIpv4 } from 'public-ip'
import sharp from 'sharp'

interface DesiredImage {
	width: number
	height: number
	format?: string
}

const maxAge = ms('2d')

export class AssetsService {
	logger: Logger
	server: FastifyInstance | undefined
	imageFolder: string

	constructor() {
		this.logger = getLogger('services/assets')
		this.imageFolder = ''
	}

	async start({
		host = 'localhost',
		port,
		imageFolder
	}: { host?: string; port: number; imageFolder: string }) {
		this.imageFolder = imageFolder
		await mkdir(imageFolder, { recursive: true })
		await this._configureServer()
		await this.server?.listen({ port, host })
		const { address } = this.server?.server.address() as AddressInfo
		return `http://${address === '0.0.0.0' ? `${await publicIpv4()}` : address}:${port}`
	}

	async stop() {
		await this.server?.close()
	}

	async _configureServer() {
		this.server = fastify({
			loggerInstance: this.logger as FastifyBaseLogger,
			disableRequestLogging: true
		})
		this.server.register(corsPlugin, { origin: '*' })
		this.server.register(compressPlugin)
		this.server.register(staticPlugin, {
			root: resolve('.'),
			wildcard: false,
			serve: false,
			maxAge: maxAge,
			immutable: true,
			cacheControl: true
		})

		this.server.get<{ Params: { id: string } }>(
			'/tracks/:id/data',
			async ({ params: { id } }, reply) => {
				const model = await tracksModel.getById(Number.parseInt(id))
				if (!model) {
					return reply.code(404).send()
				}
				return reply.sendFile(basename(model.path), dirname(model.path))
			}
		)
		this._registerMediaRoute({
			route: '/tracks/:id/media/:count',
			repository: tracksModel
		})
		this._registerMediaRoute({
			route: '/artists/:id/media/:count',
			repository: artistsModel
		})
		this._registerMediaRoute({
			route: '/albums/:id/media/:count',
			repository: albumsModel
		})
	}

	_registerMediaRoute<
		T extends { id: number; media?: string; mediaCount: number }
	>({ route, repository }: { route: string; repository: AbstractModel<T> }) {
		this.server?.get<{
			Params: { id: string; count: string }
			Querystring: { w?: string; h?: string; f?: string }
		}>(route, async ({ params: { id, count }, query: { w, h, f } }, reply) => {
			const model = await repository.getById(Number.parseInt(id))
			if (!model?.media || model.mediaCount !== Number.parseInt(count)) {
				return reply.code(404).send()
			}
			const file =
				w && h
					? await this._getTransformedImage(model as T & { media: string }, {
							width: Number.parseInt(w),
							height: Number.parseInt(h),
							format: f
						})
					: model.media
			return reply.sendFile(basename(file), dirname(file))
		})
	}

	async _getTransformedImage<
		T extends { id: number; media: string; mediaCount: number }
	>(model: T, { width, height, format = 'image/avif' }: DesiredImage) {
		const fileName = join(
			this.imageFolder,
			`${model.id}-${model.mediaCount}-${width}x${height}.${format.replace('image/', '')}`
		)

		if (
			!(await access(fileName).then(
				() => true,
				() => false
			))
		) {
			this.logger.debug({ width, height, format }, `generating ${fileName}`)
			await sharp(model.media).resize(width, height).toFile(fileName)
		}
		return fileName
	}
}

export const assetsService = new AssetsService()
