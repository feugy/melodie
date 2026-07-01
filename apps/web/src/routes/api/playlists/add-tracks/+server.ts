import { parseRequest } from '$lib/utils'
import {
	bindPlaylistToUser,
	isPlaylistVisibleToUser
} from '$lib/server/playlists'
import { playlistsModel } from '@melodie/common/models'
import { hash } from '@melodie/common/utils'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'

const bodySchema = z
	.object({
		id: z.number().optional(),
		name: z.string().optional(),
		trackIds: z.array(z.number())
	})
	.superRefine(({ id, name }, ctx) => {
		if (id === undefined && !name?.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['name'],
				message: 'Name is required when id is not provided'
			})
		}
	})

export async function POST({ request, locals }) {
	const {
		body: { id, name, trackIds }
	} = await parseRequest(request, { bodySchema })
	const userId = locals?.session?.userId
	const trimmedName = name?.trim() ?? ''

	if (id !== undefined) {
		const playlist = await playlistsModel.getById(id)
		if (!playlist || !isPlaylistVisibleToUser(playlist, userId)) {
			error(404, 'Playlist not found')
		}

		if (!trackIds.length) {
			return json({ added: 0, id: playlist.id })
		}

		await playlistsModel.save({
			id: playlist.id,
			trackIds: playlist.trackIds.concat(trackIds),
			userIds: bindPlaylistToUser(playlist.userIds, userId)
		})

		return json({ added: trackIds.length, id: playlist.id })
	}

	const createdPlaylistId = hash(`${trimmedName}:${Date.now()}`)
	await playlistsModel.save({
		id: createdPlaylistId,
		name: trimmedName,
		media: null,
		mediaCount: 0,
		mtimeMs: Date.now(),
		trackIds,
		userIds: bindPlaylistToUser([], userId)
	})

	return json({ added: trackIds.length, id: createdPlaylistId })
}
