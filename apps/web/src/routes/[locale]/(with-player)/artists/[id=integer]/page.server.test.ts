import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
	bindAlbum,
	bindArtists,
	makeAlbums,
	makeArtists,
	makeTracks
} from '$lib/tests/factories'
import { groupByAlbum } from '$lib/utils/tracks'
import { toClientTrack } from '$lib/server/models'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	albumsModel,
	artistsModel,
	init,
	tracksModel
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
		bio: { fr: faker.lorem.paragraph() },
		trackIds: []
	})
	const albums = makeAlbums(2, { agentId: agent.id, trackIds: [] })
	const tracks = makeTracks(4, { agentId: agent.id })

	bindArtists(tracks[0], [artists[0]])
	bindArtists(tracks[1], [artists[1]])
	bindArtists(tracks[2], [artists[1]])
	bindArtists(tracks[3], [artists[2]])
	bindAlbum(tracks[0], albums[1])
	bindAlbum(tracks[1], albums[1])
	bindAlbum(tracks[2], albums[0])
	bindAlbum(tracks[3], albums[0])

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await albumsModel.save(albums)
		await artistsModel.save(artists)
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('redirects on unknwon artist', async () => {
		const promise = load({
			params: { id: '1', locale: 'fr' }
		} as PageServerLoadEvent)
		await expect(promise).rejects.toEqual({
			body: { message: 'Artist not found' },
			status: 404
		})
	})

	it('returns artist', async () => {
		const response = (await load({
			params: { id: artists[0].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>
		expect(response).toEqual({
			artist: artists[0],
			albumsWithTracks: groupByAlbum(tracks.slice(0, 1).map(toClientTrack))
		})
	})

	it('returns artist with no agent', async () => {
		const response = (await load({
			params: { id: artists[1].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>
		expect(response).toEqual({
			artist: artists[1],
			albumsWithTracks: groupByAlbum(tracks.slice(1, 3).map(toClientTrack))
		})
	})
})
