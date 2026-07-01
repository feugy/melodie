import type { Playlist } from '@melodie/common/models'

export function isPlaylistVisibleToUser(
	playlist: Pick<Playlist, 'userIds'>,
	userId?: number
) {
	return (
		playlist.userIds?.length === 0 ||
		(userId !== undefined && playlist.userIds.includes(userId))
	)
}

export function bindPlaylistToUser(
	userIds: number[] | undefined,
	userId?: number
) {
	if (userId === undefined) {
		return userIds ?? []
	}
	return userIds?.includes(userId) ? userIds : [...(userIds ?? []), userId]
}
