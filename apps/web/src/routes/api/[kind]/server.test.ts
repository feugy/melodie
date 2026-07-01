import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
	makeAlbums,
	makeArtists,
	makePlaylist,
	makePlaylists,
	makeTracks
} from '$lib/tests/factories'
import type { Kind } from '$lib/types'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	type Album,
	type Artist,
	type Playlist,
	agentsModel,
	albumsModel,
	artistsModel,
	init,
	playlistsModel,
	tracksModel
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
	const tracks = makeTracks(3, { agentId: agent.id })
	const publicPlaylists = makePlaylists(3, {
		trackIds: [tracks[0].id, faker.number.int(), tracks[2].id],
		userIds: []
	})
	const visibleOwnedPlaylist = makePlaylist({
		name: 'visible-owned',
		trackIds: [tracks[1].id],
		userIds: [agent.id]
	})
	const hiddenOwnedPlaylist = makePlaylist({
		name: 'hidden-owned',
		trackIds: [tracks[1].id],
		userIds: [faker.number.int({ min: 1000 })]
	})

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await artistsModel.save(artists)
		await albumsModel.save(albums)
		await tracksModel.save(tracks)
		await playlistsModel.save([
			...publicPlaylists,
			visibleOwnedPlaylist,
			hiddenOwnedPlaylist
		])
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

	it('returns public playlists and playlists owned by current user', async () => {
		const response = await GET({
			params: { kind: 'playlists' },
			locals: { session: { token: 'test', userId: agent.id } }
		} as RequestEvent<{ kind: Kind }>)
		const content = (await response.json()) as {
			data: Array<Partial<Playlist>>
			total: number
		}

		expect(content.total).toEqual(publicPlaylists.length + 1)
		expect(
			content.data.find(({ id }) => id === hiddenOwnedPlaylist.id)
		).toBeUndefined()
		expect(
			content.data.find(({ id }) => id === visibleOwnedPlaylist.id)
		).toBeTruthy()
		expect(
			content.data.find(({ id }) => id === publicPlaylists[0].id)?.trackIds
		).toEqual([tracks[0].id, tracks[2].id])
	})

	it('returns only public playlists when no session is provided', async () => {
		const response = await GET({
			params: { kind: 'playlists' },
			locals: {}
		} as RequestEvent<{ kind: Kind }>)
		const content = (await response.json()) as {
			data: Array<Partial<Playlist>>
			total: number
		}
		expect(content.total).toEqual(publicPlaylists.length)
		expect(
			content.data.find(({ id }) => id === visibleOwnedPlaylist.id)
		).toBeUndefined()
		expect(
			content.data.find(({ id }) => id === hiddenOwnedPlaylist.id)
		).toBeUndefined()
	})
})
