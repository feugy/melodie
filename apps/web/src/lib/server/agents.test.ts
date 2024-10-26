import { faker } from '@faker-js/faker'
import { type Agent, agentsModel, init } from '@melodie/common/models'
import { addId, cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadAgentMap } from './agents'

describe('agents server utils', () => {
	let conf: DBConf

	const agents: Agent[] = [
		{
			name: faker.music.album(),
			base: faker.internet.url()
		},
		{
			name: faker.music.album(),
			base: faker.internet.url()
		},
		{
			name: faker.music.album(),
			base: faker.internet.url()
		}
	].map(addId)

	beforeAll(async () => {
		conf = await initTestDB()
		await init(conf)
		await agentsModel.save(agents)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('loads album map', async () => {
		expect(await loadAgentMap()).toEqual(
			new Map(agents.map(agent => [agent.id, agent]))
		)
	})
})
