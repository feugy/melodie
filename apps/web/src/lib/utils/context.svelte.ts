import type {
	AlbumsContext,
	ArtistsContext,
	LightAlbum,
	LightArtist,
	LightPlaylist,
	PlaylistsContext,
	ScrollContext
} from '$lib/types'
import { setContext } from 'svelte'

export function initContext() {
	let albums = $state<LightAlbum[]>([])
	setContext<AlbumsContext>('albums', {
		get: () => albums,
		set: v => {
			albums = v
		}
	})

	let artists = $state<LightArtist[]>([])
	setContext<ArtistsContext>('artists', {
		get: () => artists,
		set: v => {
			artists = v
		}
	})

	let playlists = $state<LightPlaylist[]>([])
	setContext<PlaylistsContext>('playlists', {
		get: () => playlists,
		set: v => {
			playlists = v
		}
	})

	const scroll = $state(new Map<string, number>())
	setContext<ScrollContext>('scroll', () => scroll)
}
