import { env } from '$env/dynamic/private'
import { dbConfSchema } from '@melodie/common/types'
import {
	ConfigurationMessageProvider,
	type Logger,
	getLogger
} from '@melodie/common/utils'
import v, { errors } from '@vinejs/vine'

const validator = v.compile(dbConfSchema)

export class ConfigurationService {
	logger: Logger

	constructor() {
		this.logger = getLogger('server/configuration')
	}

	async read() {
		try {
			return await validator.validate(
				{ filename: env.DB_FILENAME },
				{
					messagesProvider: new ConfigurationMessageProvider({
						filename: 'DB_FILENAME'
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
