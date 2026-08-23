import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { bindAlbum, makeAlbums, makeTracks } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	albumsModel,
	init,
	tracksModel
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { toClientTrack } from '$lib/server/models'
import type { PageServerLoadEvent } from './$types'
import { load } from './+page.server'

describe('server load()', () => {
	let conf: DBConf

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const albums = makeAlbums(3, { agentId: agent.id, trackIds: [] })
	const tracks = makeTracks(4, { agentId: agent.id })

	bindAlbum(tracks[0], albums[0])
	bindAlbum(tracks[1], albums[1])
	bindAlbum(tracks[2], albums[1])
	bindAlbum(tracks[3], albums[2])

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await albumsModel.save(albums)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('redirects on unknwon album', async () => {
		const promise = load({
			params: { id: '1', locale: 'fr' }
		} as PageServerLoadEvent)
		await expect(promise).rejects.toEqual({
			body: { message: 'Album not found' },
			status: 404
		})
	})

	it('returns album', async () => {
		const response = (await load({
			params: { id: albums[0].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>
		expect(response).toEqual({
			album: { ...albums[0] },
			tracks: expect.arrayContaining(tracks.slice(0, 1).map(toClientTrack))
		})
		expect(response.tracks).toHaveLength(1)
	})

	it('returns album with no agent', async () => {
		const response = (await load({
			params: { id: albums[1].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>
		expect(response).toEqual({
			album: { ...albums[1] },
			tracks: expect.arrayContaining(tracks.slice(1, 3).map(toClientTrack))
		})
		expect(response.tracks).toHaveLength(2)
	})
})
