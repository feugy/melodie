import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makeTracks } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	init,
	tracksModel
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import type { Reference } from '@melodie/common/utils'
import { POST } from './+server'

describe('POST /api/get-tracks', () => {
	let conf: DBConf

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const nullRef: Reference = [1, null]
	const tracks = makeTracks(3)

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns tracks by id', async () => {
		const request = new Request('http://localhost:3000/api/get-tracks', {
			method: 'POST',
			body: JSON.stringify({ ids: [tracks[1].id] })
		})
		const response = await POST({ request } as Parameters<typeof POST>[0])
		expect(await response.json()).toEqual({
			data: tracks.slice(1, 2),
			total: 1
		})
	})

	it('returns mulitple tracks by id', async () => {
		const request = new Request('http://localhost:3000/api/get-tracks', {
			method: 'POST',
			body: JSON.stringify({ ids: [tracks[1].id, tracks[0].id] })
		})
		const response = await POST({ request } as Parameters<typeof POST>[0])
		expect(await response.json()).toEqual({
			data: tracks.slice(0, 2).reverse(),
			total: 2
		})
	})
})
