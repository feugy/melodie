import type { PartialWithReq } from '../types.ts'
import { AbstractModel } from './abstract-model.ts'

export interface Settings {
	id: number
	/** list of music folders. */
	folders: string[]
	/** network port to listen to. */
	port: number
}

export class SettingsModel extends AbstractModel<Settings> {
	constructor() {
		super({
			name: 'settings',
			jsonColumns: ['folders']
		})
	}

	/** Id of the singleton model */
	get ID() {
		return 1000
	}

	async get() {
		// biome-ignore lint/style/noNonNullAssertion: table row is inserted during migrations
		return (await this.getById(this.ID))!
	}

	async save(data: PartialWithReq<Settings, 'id'>) {
		await super.save(data)
		return this.get()
	}
}

export const settingsModel = new SettingsModel()
