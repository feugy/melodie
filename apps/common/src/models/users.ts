import { buildUpsert, whereIn } from '../utils/sqlite.ts'
import { AbstractModel, searchPlaceholder } from './abstract-model.ts'

export interface User {
	id: number
	name: string
	hash: string
	createdAt: number
}

export class UsersModel extends AbstractModel<User> {
	constructor() {
		super({ name: 'users', searchCol: 'name' })
	}

	/**
	 * Saves given users to database.
	 * It creates new record when needed, and updates existing ones (based on provided id).
	 * Partial update is supported: incoming data is merged with previous.
	 * @param data Single or array of saved (partial) users
	 */
	// @ts-ignore -- TS doesn't like me overloading AbstractModel.save()
	async save(data: Partial<User>): Promise<User>
	// @ts-ignore -- TS doesn't like me overloading AbstractModel.save()
	async save(data: Partial<User>[]): Promise<User[]>
	// @ts-ignore -- TS doesn't like me overloading AbstractModel.save()
	async save(data: Partial<User> | Partial<User>[]): Promise<User | User[]> {
		if (!this.db) throw new Error('model not initialized')
		const isMultiple = Array.isArray(data)
		const input = isMultiple ? data : [data]
		this.logger.debug('saving', { data: input })
		const upsert = this.db.prepare(buildUpsert(this.name, input, true))
		const results = this.db.transaction(models => {
			const ids = []
			for (const model of models) {
				ids.push(upsert.run({ id: null, ...model }).lastInsertRowid as number)
			}
			return this.db
				?.query<User, number[]>(
					`SELECT * FROM ${this.name} WHERE ${whereIn('id', ids)}`
				)
				.all(...ids)
		})(input)
		return isMultiple ? results : results[0]
	}
}

export const usersModel = new UsersModel()
