import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makeAlbums, makeArtists } from '$lib/tests/factories'
import type { Kind } from '$lib/types'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	type Album,
	type Artist,
	agentsModel,
	albumsModel,
	artistsModel,
	init
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import type { RequestEvent } from '@sveltejs/kit'
import { GET } from './+server'

describe('GET /api/[kind]', () => {
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
	const albums = makeAlbums(3, { agentId: agent.id })

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await artistsModel.save(artists)
		await albumsModel.save(albums)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns all artists', async () => {
		const response = await GET({ params: { kind: 'artists' } } as RequestEvent<{
			kind: Kind
		}>)
		const content = await response.json()
		const data: Partial<Artist>[] = artists.map(
			({ id, name, media, mediaCount, refs, agentId, trackIds, bio }) => ({
				id,
				name,
				media,
				mediaCount,
				agentId,
				refs,
				trackIds,
				bio
			})
		)
		expect(content).toEqual({ data, total: data.length })
	})

	it('returns all albums', async () => {
		const response = await GET({ params: { kind: 'albums' } } as RequestEvent<{
			kind: Kind
		}>)
		const content = await response.json()
		const data: Partial<Album>[] = albums.map(
			({ id, name, media, mediaCount, refs, agentId, trackIds }) => ({
				id,
				name,
				media,
				mediaCount,
				agentId,
				refs,
				trackIds
			})
		)
		expect(content).toEqual({ data, total: data.length })
	})
})
