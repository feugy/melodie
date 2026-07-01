import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makePlaylist, makePlaylists } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	init,
	playlistsModel
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

	const playlists = makePlaylists(3)
	const ownedPlaylist = makePlaylist({ userIds: [agent.id] })
	const hiddenPlaylist = makePlaylist({
		userIds: [faker.number.int({ min: 1000 })]
	})

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await playlistsModel.save([...playlists, ownedPlaylist, hiddenPlaylist])
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns total playlists', async () => {
		const response = await load({
			params: { locale: 'fr' },
			locals: { session: { token: 'test', userId: agent.id } }
		} as PageServerLoadEvent)

		expect(response).toEqual({ total: playlists.length + 1 })
	})

	it('returns only public playlists without session', async () => {
		const response = await load({
			params: { locale: 'fr' },
			locals: {}
		} as PageServerLoadEvent)

		expect(response).toEqual({ total: playlists.length })
	})
})
