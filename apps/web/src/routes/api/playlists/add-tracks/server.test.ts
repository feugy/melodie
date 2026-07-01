import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { makePlaylist, makePlaylists, makeTracks } from '$lib/tests/factories'
import { init, playlistsModel, tracksModel } from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { POST } from './+server'

describe('POST /api/playlists/add-tracks', () => {
	let conf: DBConf

	const tracks = makeTracks(3)
	const [playlist] = makePlaylists(1, {
		trackIds: [tracks[0].id],
		userIds: []
	})
	const ownedPlaylist = makePlaylist({
		trackIds: [tracks[0].id],
		userIds: [42]
	})
	const privatePlaylist = makePlaylist({
		trackIds: [tracks[0].id],
		userIds: [999]
	})

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		await tracksModel.save(tracks)
		await playlistsModel.save([playlist, ownedPlaylist, privatePlaylist])
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('appends given track ids to playlist', async () => {
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					id: playlist.id,
					trackIds: [tracks[1].id, tracks[2].id]
				})
			}
		)

		const response = await POST({ request } as Parameters<typeof POST>[0])

		expect(await response.json()).toEqual({
			added: 2,
			id: playlist.id
		})
		expect(await playlistsModel.getById(playlist.id)).toMatchObject({
			trackIds: [tracks[0].id, tracks[1].id, tracks[2].id],
			userIds: []
		})
	})

	it('binds current user id when appending tracks', async () => {
		const userId = 42
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					id: playlist.id,
					trackIds: [tracks[1].id]
				})
			}
		)

		await POST({
			request,
			locals: { session: { token: 'test', userId } }
		} as Parameters<typeof POST>[0])

		expect(await playlistsModel.getById(playlist.id)).toMatchObject({
			userIds: [userId]
		})
	})

	it('appends tracks when user owns playlist', async () => {
		const userId = 42
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					id: ownedPlaylist.id,
					trackIds: [tracks[1].id]
				})
			}
		)

		const response = await POST({
			request,
			locals: { session: { token: 'test', userId } }
		} as Parameters<typeof POST>[0])

		expect(await response.json()).toEqual({ added: 1, id: ownedPlaylist.id })
		expect(await playlistsModel.getById(ownedPlaylist.id)).toMatchObject({
			trackIds: [tracks[0].id, tracks[1].id],
			userIds: [userId]
		})
	})

	it('rejects appending tracks to private playlist not owned by current user', async () => {
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					id: privatePlaylist.id,
					trackIds: [tracks[1].id]
				})
			}
		)

		const promise = POST({
			request,
			locals: { session: { token: 'test', userId: 42 } }
		} as Parameters<typeof POST>[0])

		await expect(promise).rejects.toEqual({
			body: { message: 'Playlist not found' },
			status: 404
		})
		expect(await playlistsModel.getById(privatePlaylist.id)).toMatchObject({
			trackIds: [tracks[0].id]
		})
	})

	it('handles empty track ids', async () => {
		const userId = 42
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					id: ownedPlaylist.id,
					trackIds: []
				})
			}
		)

		const response = await POST({
			request,
			locals: { session: { token: 'test', userId } }
		} as Parameters<typeof POST>[0])

		expect(await response.json()).toEqual({ added: 0, id: ownedPlaylist.id })
	})

	it('creates a new playlist with given name', async () => {
		const name = 'Created from dropdown'
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					name,
					trackIds: [tracks[0].id, tracks[2].id]
				})
			}
		)

		const response = await POST({ request } as Parameters<typeof POST>[0])
		const body = (await response.json()) as {
			added: number
			id: number
		}

		expect(body.added).toEqual(2)
		const created = await playlistsModel.getById(body.id)
		expect(created).toMatchObject({
			name,
			userIds: [],
			trackIds: [tracks[0].id, tracks[2].id]
		})
	})

	it('creates a playlist bound to current user', async () => {
		const userId = 123
		const name = 'Created for current user'
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({
					name,
					trackIds: [tracks[0].id]
				})
			}
		)

		const response = await POST({
			request,
			locals: { session: { token: 'test', userId } }
		} as Parameters<typeof POST>[0])
		const body = (await response.json()) as { id: number }

		expect(await playlistsModel.getById(body.id)).toMatchObject({
			name,
			userIds: [userId],
			trackIds: [tracks[0].id]
		})
	})

	it('fails when both playlist id and name are missing', async () => {
		const request = new Request(
			'http://localhost:3000/api/playlists/add-tracks',
			{
				method: 'POST',
				body: JSON.stringify({ trackIds: [tracks[0].id] })
			}
		)

		const promise = POST({ request } as Parameters<typeof POST>[0])
		await expect(promise).rejects.toMatchObject({
			status: 400,
			body: {
				message: 'body: Name is required when id is not provided at "name"'
			}
		})
	})
})
