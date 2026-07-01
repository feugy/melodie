import { base } from '$app/paths'
import {
	bindPlaylistToUser,
	database,
	isPlaylistVisibleToUser,
	loadTracks
} from '$lib/server'
import { playlistsModel } from '@melodie/common/models'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

async function loadPlaylist(id: number) {
	await database.init()
	const playlist = await playlistsModel.getById(id)
	if (!playlist) {
		return error(404, 'Playlist not found')
	}
	return playlist
}
export const load: PageServerLoad = async ({ params: { id } }) => {
	const playlist = await loadPlaylist(Number.parseInt(id))
	const tracks = await loadTracks(playlist)
	return {
		playlist,
		tracks
	}
}

export const actions: Actions = {
	rename: async ({ request, locals, params: { id } }) => {
		const playlist = await loadPlaylist(Number.parseInt(id))
		if (!isPlaylistVisibleToUser(playlist, locals?.session?.userId)) {
			return error(404, 'Playlist not found')
		}
		const form = await request.formData()
		const name = form.get('name')?.toString().trim() ?? ''
		if (!name) {
			return fail(400, {
				message: 'Invalid input'
			})
		}

		await playlistsModel.save({
			id: playlist.id,
			name,
			trackIds: playlist.trackIds,
			userIds: bindPlaylistToUser(playlist.userIds, locals.session?.userId)
		})
		return { success: true }
	},

	delete: async ({ locals, params: { id, locale } }) => {
		const playlist = await loadPlaylist(Number.parseInt(id))
		if (!isPlaylistVisibleToUser(playlist, locals?.session?.userId)) {
			return error(404, 'Playlist not found')
		}
		await playlistsModel.removeByIds([playlist.id])
		throw redirect(303, `${base}/${locale}/playlists`)
	}
}
