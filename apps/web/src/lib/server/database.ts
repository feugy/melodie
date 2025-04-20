import { init } from '@melodie/common/models'
import type { DBConf } from '@melodie/common/types'
import { configurationService } from './configuration'

export class Database {
	initialized = false

	async init() {
		if (this.initialized) return

		const conf: DBConf = await configurationService.read()
		await init(conf, false)
		this.initialized = true
	}
}

export const database = new Database()
