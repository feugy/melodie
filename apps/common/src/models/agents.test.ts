import type { Database } from 'bun:sqlite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { type Agent, AgentsModel, agentsModel } from './agents.ts'

describe('Agents model', () => {
	let db: Database
	let conf: DBConf

	const models: Agent[] = [
		{
			id: 2634312,
			name: 'local',
			base: faker.internet.url()
		},
		{
			id: -1,
			name: 'online',
			base: faker.internet.url()
		}
	]

	beforeAll(async () => {
		;({ conf, db } = await initTestDB())
		await agentsModel.init(conf)
	})

	beforeEach(async () => {
		await agentsModel.reset()
		const insert = db.prepare(
			`INSERT INTO ${agentsModel.name} VALUES (:id, :base, :name)`
		)
		db.transaction(models => {
			for (const model of models) {
				insert.run(model)
			}
		})(models)
	})

	afterAll(async () => {
		await AgentsModel.release()
		await cleanTestTB(conf)
	})

	describe('save()', () => {
		it('adds new agents', async () => {
			const agent: Agent = {
				id: 2639762,
				name: 'local',
				base: faker.internet.url()
			}

			await agentsModel.save(agent)
			expect(await agentsModel.getById(agent.id)).toEqual(agent)
		})

		it('updates existing agents', async () => {
			const base = faker.internet.url()
			const { id } = models[1]

			await agentsModel.save({ id, base })
			expect(await agentsModel.getById(id)).toEqual({ ...models[1], base })
		})
	})
})
