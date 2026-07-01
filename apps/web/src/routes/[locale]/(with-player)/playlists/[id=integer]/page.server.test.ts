import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { base } from '$app/paths'
import { makePlaylist, makePlaylists, makeTracks } from '$lib/tests/factories'
import { faker } from '@faker-js/faker'
import {
	type Agent,
	agentsModel,
	init,
	playlistsModel,
	tracksModel
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import type { PageServerLoadEvent } from './$types'
import { actions, load } from './+page.server'

describe('server load()', () => {
	let conf: DBConf

	const agent: Agent = {
		id: faker.number.int(),
		name: 'test',
		base: 'http://localhost:3000'
	}

	const tracks = makeTracks(4, { agentId: agent.id })
	const playlists = makePlaylists(2, {
		trackIds: [tracks[0].id, tracks[2].id, tracks[0].id]
	})
	const privatePlaylist = makePlaylist({
		trackIds: [tracks[1].id],
		userIds: [faker.number.int({ min: 1000 })]
	})

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await agentsModel.save(agent)
		await playlistsModel.save([...playlists, privatePlaylist])
		await tracksModel.save(tracks)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('redirects on unknown playlist', async () => {
		const promise = load({
			params: { id: '1', locale: 'fr' }
		} as PageServerLoadEvent)
		await expect(promise).rejects.toEqual({
			body: { message: 'Playlist not found' },
			status: 404
		})
	})

	it('returns playlist and tracks in playlist order', async () => {
		const response = (await load({
			params: { id: playlists[0].id.toString(), locale: 'fr' }
		} as PageServerLoadEvent)) as Record<string, unknown>

		expect(response).toEqual({
			playlist: { ...playlists[0], trackPaths: null },
			tracks: [tracks[0], tracks[2], tracks[0]]
		})
	})

	it('renames playlist', async () => {
		const name = faker.lorem.words(3)
		const form = new FormData()
		form.set('name', name)

		const response = await actions.rename({
			request: new Request('http://localhost', { method: 'POST', body: form }),
			locals: { session: { token: 'test', userId: agent.id } },
			params: { id: playlists[0].id.toString(), locale: 'fr' }
		} as unknown as Parameters<NonNullable<typeof actions.rename>>[0])

		expect(response).toEqual({ success: true })
		expect(await playlistsModel.getById(playlists[0].id)).toMatchObject({
			id: playlists[0].id,
			name,
			trackIds: playlists[0].trackIds,
			userIds: [agent.id],
			trackPaths: null
		})
	})

	it('rejects rename with empty name', async () => {
		const form = new FormData()
		form.set('name', '    ')

		const response = await actions.rename({
			request: new Request('http://localhost', { method: 'POST', body: form }),
			locals: { session: { token: 'test', userId: agent.id } },
			params: { id: playlists[0].id.toString(), locale: 'fr' }
		} as unknown as Parameters<NonNullable<typeof actions.rename>>[0])

		expect(response).toMatchObject({
			status: 400,
			data: { message: 'Invalid input' }
		})
	})

	it('rejects rename on private playlist not owned by current user', async () => {
		const form = new FormData()
		form.set('name', faker.lorem.words(2))

		const promise = actions.rename({
			request: new Request('http://localhost', { method: 'POST', body: form }),
			locals: { session: { token: 'test', userId: agent.id } },
			params: { id: privatePlaylist.id.toString(), locale: 'fr' }
		} as unknown as Parameters<NonNullable<typeof actions.rename>>[0])

		await expect(promise).rejects.toEqual({
			body: { message: 'Playlist not found' },
			status: 404
		})
	})

	it('deletes playlist and redirects to playlists list', async () => {
		const promise = actions.delete({
			params: { id: playlists[1].id.toString(), locale: 'fr' }
		} as unknown as Parameters<NonNullable<typeof actions.delete>>[0])

		await expect(promise).rejects.toEqual({
			status: 303,
			location: `${base}/fr/playlists`
		})
		expect(await playlistsModel.getById(playlists[1].id)).toEqual(null)
	})

	it('rejects delete on private playlist not owned by current user', async () => {
		const promise = actions.delete({
			locals: { session: { token: 'test', userId: agent.id } },
			params: { id: privatePlaylist.id.toString(), locale: 'fr' }
		} as unknown as Parameters<NonNullable<typeof actions.delete>>[0])

		await expect(promise).rejects.toEqual({
			body: { message: 'Playlist not found' },
			status: 404
		})
		expect(await playlistsModel.getById(privatePlaylist.id)).toBeTruthy()
	})
})
