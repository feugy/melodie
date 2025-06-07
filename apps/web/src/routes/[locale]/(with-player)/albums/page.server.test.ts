import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makeAlbums } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	albumsModel,
	init
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import type { PageServerLoadEvent } from './$types'
import { load } from './+page.server'

describe('server load()', () => {
	let conf: DBConf

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const albums = makeAlbums(3, { agentId: agent.id })

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await albumsModel.save(albums)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns agents and first albums with covers', async () => {
		const response = await load({
			params: { locale: 'fr' }
		} as PageServerLoadEvent)

		expect(response).toEqual({ total: albums.length })
	})
})
