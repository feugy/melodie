import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makeArtists } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	artistsModel,
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

	const artists = makeArtists(3, {
		agentId: agent.id,
		bio: { fr: faker.lorem.paragraph() }
	})

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await artistsModel.save(artists)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns agents and first artists with avatars', async () => {
		const response = await load({
			params: { locale: 'fr' }
		} as PageServerLoadEvent)

		expect(response).toEqual({
			firstArtists: expect.arrayContaining(artists)
		})
		expect((response as Record<string, unknown>).firstArtists).toHaveLength(
			artists.length
		)
	})
})
