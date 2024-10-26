import { faker } from '@faker-js/faker'
import { type Knex, knex } from 'knex'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { type Agent, AgentsModel, agentsModel } from './agents.ts'

describe.each([{ kind: 'pg' }, { kind: 'sqlite3' }])(
	'Agents model ($kind}',
	({ kind }) => {
		let db: Knex
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
			conf = await initTestDB(kind as DBConf['kind'])
			db = knex({
				client: conf.kind,
				connection: conf,
				useNullAsDefault: true
			})
			await agentsModel.init(conf)
		})

		beforeEach(async () => {
			await agentsModel.reset()
			await db(agentsModel.name).insert(models)
		})

		afterAll(async () => {
			await AgentsModel.release()
			await db.destroy()
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
	}
)
