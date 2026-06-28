import { access, mkdir, readFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { basename, dirname, join, resolve } from 'node:path'
import compressPlugin from '@fastify/compress'
import corsPlugin from '@fastify/cors'
import staticPlugin from '@fastify/static'
import { getLogTapeFastifyLogger } from '@logtape/fastify'
import {
	type AbstractModel,
	albumsModel,
	artistsModel,
	init,
	tracksModel
} from '@melodie/common/models'
import { type Logger, getLogger, hash, verifyJWT } from '@melodie/common/utils'
import { crypto } from 'acme-client'
import { file } from 'bun'
import type { FastifyInstance } from 'fastify'
import { fastify } from 'fastify'
import ms from 'ms'
import open from 'open'
import { publicIpv4 } from 'public-ip'
import sharp from 'sharp'
import type { Configuration } from './configuration.ts'

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
		host = '127.0.0.1',
		port,
		tls,
		...conf
	}: Pick<
		Configuration,
		'host' | 'port' | 'imageFolder' | 'tls' | 'database' | 'openUI'
	>) {
		this.imageFolder = conf.imageFolder
		await init(conf.database)
		// required by Web UI
		process.env.DB_FILENAME = conf.database.filename
		await mkdir(this.imageFolder, { recursive: true })
		await this._configureServer(tls)
		await this.server?.listen({ port, host })
		const { address } = this.server?.server.address() as AddressInfo
		const csr = tls
			? crypto.readCsrDomains(await file(tls.csr).text())
			: { altNames: [] }
		const url = csr.altNames.length
			? `https://${csr.altNames[0]}`
			: `http://${Bun.env.NODE_ENV === 'production' ? (address === '0.0.0.0' ? await publicIpv4() : address) : 'localhost'}:${port}`
		this.logger.info('server started', { host, url })
		if (conf.openUI) {
			await open(`${url}/web`)
		}
		return url
	}

	async stop() {
		await this.server?.close()
	}

	async _configureServer(tls: Configuration['tls']) {
		this.logger.debug('configure server', { tls })
		const conf: Record<string, unknown> = {
			disableRequestLogging: true,
			loggerInstance: getLogTapeFastifyLogger({
				category: ['@melodie', 'services', 'assets']
			})
		}
		if (tls) {
			conf.https = {
				key: await readFile(tls.key),
				cert: await readFile(tls.cert)
			}
		}
		this.server = fastify(conf)
		this.server.register(corsPlugin, { origin: '*' })
		this.server.register(compressPlugin)
		this.server.addHook(
			'onRequest',
			async ({ hostname, protocol, url }, reply) => {
				if (
					tls &&
					protocol === 'http' &&
					hostname !== 'localhost' &&
					hostname !== '127.0.0.1'
				) {
					reply.redirect(`https://${hostname}${url}`, 308)
				}
			}
		)
		if (!Bun.env.SKIP_ASSETS_AUTH) {
			this.server.addHook('onRequest', async (request, reply) => {
				const { url } = request
				if (url === '/' || url.startsWith('/web')) return

				const authHeader = request.headers.authorization
				const cookie = request.headers.cookie
				const token = authHeader?.startsWith('Bearer ')
					? authHeader.slice(7)
					: cookie
							?.split(';')
							.map(c => c.trim())
							.find(c => c.startsWith('token='))
							?.slice(6)

				if (!token) return reply.code(401).send('Unauthorized')

				try {
					await verifyJWT(token)
				} catch {
					return reply.code(401).send('Unauthorized')
				}
			})
		}
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
		await this.server.register(webPlugin, { prefix: '/web' })
		this.server.get('/', (_, reply) => {
			reply.redirect('/web', 308)
		})
	}

	_registerMediaRoute<
		T extends { id: number; media: null | string; mediaCount: number }
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
			`${hash(model.media)}-${width}x${height}.${format.replace('image/', '')}`
		)

		if (
			!(await access(fileName).then(
				() => true,
				() => false
			))
		) {
			this.logger.debug(`generating ${fileName}`, { width, height, format })
			await sharp(model.media).resize(width, height).toFile(fileName)
		}
		return fileName
	}
}

async function webPlugin(server: FastifyInstance) {
	// adapter-node defaults to https when PROTOCOL_HEADER is unset.
	// Behind Fastify, set and populate x-forwarded-proto so SSR origin matches browser origin.
	process.env.PROTOCOL_HEADER ||= 'x-forwarded-proto'
	// @ts-expect-error -- no types for bundled UI
	const { handler: sveltekit } = await import('web')
	// https://stackoverflow.com/a/72317072
	server.removeAllContentTypeParsers()
	server.addContentTypeParser('*', (_1, _2, done) => done(null, null))
	server.all('*', ({ protocol, raw: req }, { raw: res }) => {
		req.headers['x-forwarded-proto'] = protocol
		sveltekit(req, res, () => {})
	})
}

export const assetsService = new AssetsService()
