import {
	DB,
	DB_DATABASE,
	DB_FILENAME,
	DB_HOST,
	DB_PASSWORD,
	DB_PORT,
	DB_USER
} from '$env/static/private'
import { dbConfSchema } from '@melodie/common/types'
import {
	ConfigurationMessageProvider,
	type Logger,
	getLogger
} from '@melodie/common/utils'
import v, { errors } from '@vinejs/vine'
import { config } from 'dotenv-flow'

const validator = v.compile(dbConfSchema)

export class ConfigurationService {
	logger: Logger

	constructor() {
		this.logger = getLogger('server/configuration')
	}

	async read() {
		config({ silent: true })

		const dbKind = DB

		try {
			return await validator.validate(
				dbKind === 'sqlite3'
					? { kind: dbKind, filename: DB_FILENAME }
					: {
							kind: dbKind,
							host: DB_HOST,
							port: DB_PORT,
							user: DB_USER,
							password: DB_PASSWORD,
							database: DB_DATABASE
						},
				{
					messagesProvider: new ConfigurationMessageProvider({
						filename: 'DB_FILENAME',
						host: 'DB_HOST',
						port: 'DB_PORT',
						user: 'DB_USER',
						password: 'DB_PASSWORD',
						database: 'DB_DATABASE',
						kind: 'DB'
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
