import { dbConfSchema } from '@melodie/common/types'
import {
	ConfigurationMessageProvider,
	type Logger,
	getLogger
} from '@melodie/common/utils'
import v, { errors } from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { config } from 'dotenv-flow'

const configurationSchema = v.object({
	port: v.number().positive().withoutDecimals(),
	host: v.string().optional(),
	folders: v.array(v.string().minLength(3)).minLength(1),
	imageFolder: v.string(),
	database: dbConfSchema
})

export type Configuration = Infer<typeof configurationSchema>

const validator = v.compile(configurationSchema)

export class ConfigurationService {
	logger: Logger

	constructor() {
		this.logger = getLogger('services/configuration')
	}

	async read() {
		config({ silent: true })

		const dbKind = process.env.DB

		try {
			return await validator.validate(
				{
					folders: process.env.FOLDERS?.split(',') ?? [],
					imageFolder: process.env.IMAGE_FOLDER,
					port: process.env.PORT,
					host: process.env.HOST ?? 'localhost',
					database:
						dbKind === 'sqlite3'
							? {
									kind: dbKind,
									filename: process.env.DB_FILENAME
								}
							: {
									kind: dbKind,
									host: process.env.DB_HOST,
									port: process.env.DB_PORT,
									user: process.env.DB_USER,
									password: process.env.DB_PASSWORD,
									database: process.env.DB_DATABASE
								}
				},
				{
					messagesProvider: new ConfigurationMessageProvider({
						folders: 'FOLDERS',
						imageFolder: 'IMAGE_FOLDER',
						kind: 'DB',
						port: 'PORT',
						'database.filename': 'DB_FILENAME',
						'database.host': 'DB_HOST',
						'database.port': 'DB_PORT',
						'database.user': 'DB_USER',
						'database.password': 'DB_PASSWORD',
						'database.database': 'DB_DATABASE'
					})
				}
			)
		} catch (error) {
			this.logger.error({ error }, 'failed to read configuration')
			if (error instanceof errors.E_VALIDATION_ERROR) {
				throw new Error(
					`Invalid configuration: ${(error.messages as { message: string }[]).map(({ message }) => message).join(', ')}`
				)
			}
			throw error
		}
	}
}

export const configurationService = new ConfigurationService()
