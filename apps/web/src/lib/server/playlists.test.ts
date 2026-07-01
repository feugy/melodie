import { describe, expect, it } from 'bun:test'
import { bindPlaylistToUser, isPlaylistVisibleToUser } from './playlists'

describe('isPlaylistVisibleToUser', () => {
	it('returns true for public playlists', () => {
		expect(isPlaylistVisibleToUser({ userIds: [] })).toBeTrue()
	})

	it('returns true when current user owns the playlist', () => {
		expect(isPlaylistVisibleToUser({ userIds: [10, 20] }, 20)).toBeTrue()
	})

	it('returns false when current user does not own the playlist', () => {
		expect(isPlaylistVisibleToUser({ userIds: [10, 20] }, 30)).toBeFalse()
	})
})

describe('bindPlaylistToUser', () => {
	it('returns empty list when no user is provided and userIds is undefined', () => {
		expect(bindPlaylistToUser(undefined)).toEqual([])
	})

	it('adds current user id when missing', () => {
		expect(bindPlaylistToUser([1, 2], 3)).toEqual([1, 2, 3])
	})

	it('does not duplicate current user id', () => {
		expect(bindPlaylistToUser([1, 2], 2)).toEqual([1, 2])
	})
})
