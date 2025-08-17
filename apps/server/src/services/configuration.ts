import { access, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { init, settingsModel } from '@melodie/common/models'
import { dbConfSchema } from '@melodie/common/types'
import {
	ConfigurationMessageProvider,
	type Logger,
	getLogger
} from '@melodie/common/utils'
import v, { errors } from '@vinejs/vine'
import type { FieldContext, Infer } from '@vinejs/vine/types'
import * as acme from 'acme-client'
import { type BunRequest, file, serve } from 'bun'
import ora from 'ora'
import { dialog } from '../utils/cli.js'

export type Configuration = Infer<typeof configurationSchema>

const challengePath = ['.well-known', 'acme-challenge']

export class ConfigurationService {
	logger: Logger

	constructor() {
		this.logger = getLogger('services/configuration')
	}

	async read(args: string[]) {
		this.logger.info({ args }, 'reading configuration...')
		let {
			values: { config: configPath, open: openUI }
		} = parseArgs({
			args,
			options: {
				// folder to contain database, optimized images, and optional TLS certificates
				config: { type: 'string', short: 'c', default: join('.', '.melodie') },
				// when true, the UI will be opened in the default browser
				open: { type: 'boolean', short: 'o', default: false }
			}
		})
		// turn to an absolute path to make it easier to read in logs
		configPath = resolve(configPath)
		if (!(await exists(configPath))) {
			await this.prepareConfig(configPath)
		}
		const database = await migrateDB(configPath)
		const { folders, port } = await settingsModel.get()
		const tls = await readCertificates(configPath)

		return await validate(
			{
				database,
				folders,
				imageFolder: join(configPath, '.images'),
				openUI,
				port,
				host: openUI ? 'localhost' : '0.0.0.0',
				tls
			},
			this.logger
		)
	}

	private async prepareConfig(configPath: string) {
		try {
			const answers = await dialog<{
				folder: string
				port: number
				domain?: string
				email?: string
			}>([
				{
					key: 'folder',
					question: `
Welcome to Mélodie!
Press Ctrl+C to cancel at any time.

In which folder is your music located? (e.g. /home/user/music)`,
					schema: v.string().minLength(1)
				},
				{
					key: 'port',
					question: 'What network port do you want to use? (e.g. 80)',
					defaultValue: '80',
					schema: v.number().positive().withoutDecimals()
				},
				{
					key: 'ssl',
					schema: v.string().toLowerCase(),
					question: 'Do you need to generate TLS certificates? (Y/n)',
					defaultValue: 'Y',
					when: {
						y: [
							{
								key: 'domain',
								question: `The domain name must be publicly accessible and point to the computer currently running Mélodie.
If you can't use port 80, make sure your domain is redirecting to the port $port.

What domain name do you want to use? (e.g. example.com)`,
								schema: v.string().url({
									require_protocol: false,
									require_port: false,
									require_host: true
								})
							},
							{
								key: 'email',
								question: `What email do you want to use? (For Let's Encrypt registration)`,
								schema: v.string().email()
							}
						]
					}
				}
			])
			await mkdir(join(configPath, '.images'), { recursive: true })
			if (answers.domain && answers.email) {
				console.log('\n')
				const spinner = ora('Generating certificates...').start()
				await this.generateCertificates(configPath, answers)
				spinner.succeed('certificates generated!')
			}
			console.log(`\nSaving configuration in folder ${configPath}`)
			await migrateDB(configPath)
			await settingsModel.save({
				id: settingsModel.ID,
				port: answers.port,
				folders: [answers.folder]
			})
		} catch (error) {
			// do not leave pending files
			await rm(configPath, { recursive: true, force: true })
			throw error
		}
	}

	public async generateCertificates(
		configPath: string,
		{ port, domain, email }: { port: number; domain?: string; email?: string }
	) {
		const destination = join(configPath, 'tls')
		const challengeFolder = join(tmpdir(), 'melodie-acme')

		const client = new acme.Client({
			directoryUrl: acme.directory.letsencrypt.production,
			accountKey: await acme.crypto.createPrivateKey()
		})

		const [key, csr] = await acme.crypto.createCsr({
			altNames: [domain ?? '']
		})

		this.logger.debug({ port, domain }, 'starting ACME client')
		const server = serve({
			port,
			routes: {
				[['', ...challengePath, ':fileName'].join('/')]: async ({
					params: { fileName },
					url
				}: BunRequest<'/:fileName'>) => {
					this.logger.debug({ url }, `serving file: ${url}`)
					return new Response(file(join(challengeFolder, fileName)))
				}
			}
		})

		const cert = await client.auto({
			csr,
			email,
			termsOfServiceAgreed: true,
			challengeCreateFn: async (
				{ identifier },
				{ type, token },
				keyAuthorization
			) => {
				if (type === 'http-01') {
					const challenge = file(join(challengeFolder, token))
					this.logger.debug(
						{ identifier, type, token },
						`creating challenge at path: ${challenge.name}`
					)
					await challenge.write(keyAuthorization)
				} else {
					throw new Error(`Unsupported challenge type: ${type}`)
				}
			},
			challengeRemoveFn: async ({ identifier }, { type, token }) => {
				if (type === 'http-01') {
					const challenge = file(join(challengeFolder, token))
					this.logger.debug(
						{ identifier, type, token },
						`removing challenge at path: ${challenge.name}`
					)
					await challenge.delete()
				} else {
					throw new Error(`Unsupported challenge type: ${type}`)
				}
			}
		})

		await server.stop()
		await rm(challengeFolder, { recursive: true, force: true })
		this.logger.debug('ACME client stopped')

		await mkdir(dirname(destination), { recursive: true })
		await file(join(destination, 'key.pem')).write(key)
		await file(join(destination, 'csr.pem')).write(csr)
		await file(join(destination, 'cert.pem')).write(cert)
		this.logger.info({ destination }, 'certificates saved!')
	}
}

export const configurationService = new ConfigurationService()

async function exists(path: string) {
	return access(path).then(
		() => true,
		() => false
	)
}

async function migrateDB(configPath: string) {
	const database: Configuration['database'] = {
		filename: join(configPath, '.db.sqlite3')
	}
	await init(database, true)
	return database
}

async function readCertificates(configPath: string) {
	const tls = join(configPath, 'tls')
	return (await exists(tls))
		? {
				csr: `${tls}/csr.pem`,
				key: `${tls}/key.pem`,
				cert: `${tls}/cert.pem`
			}
		: undefined
}

const isReadable = v.createRule(async function file(
	value: unknown,
	kind: 'file' | 'folder',
	field: FieldContext
) {
	if (typeof value !== 'string') return
	if (!(await exists(value))) {
		field.report(`${value} is not a readable ${kind}`, 'kind', field)
	}
})

const configurationSchema = v.object({
	port: v.number().positive().withoutDecimals(),
	host: v.string().optional(),
	tls: v
		.object({
			csr: v.string().use(isReadable('file')),
			key: v.string().use(isReadable('file')),
			cert: v.string().use(isReadable('file'))
		})
		.optional(),
	folders: v.array(v.string().minLength(1)).minLength(1),
	imageFolder: v.string().use(isReadable('folder')),
	database: dbConfSchema,
	openUI: v.boolean().optional()
})

const validator = v.compile(configurationSchema)

async function validate(input: unknown, logger: Logger) {
	try {
		return await validator.validate(input, {
			messagesProvider: new ConfigurationMessageProvider({})
		})
	} catch (error) {
		logger.error({ error }, 'failed to read configuration')
		if (error instanceof errors.E_VALIDATION_ERROR) {
			throw new Error(
				`Invalid configuration: ${(error.messages as { message: string }[]).map(({ message }) => message).join(', ')}`
			)
		}
		throw error
	}
}
