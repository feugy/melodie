import { faker } from '@faker-js/faker'
import type {
	Agent,
	Album,
	Artist,
	Playlist,
	Track
} from '@melodie/common/models'
import { addId, addRefs, makeRef } from '@melodie/common/tests'

export function makeTrack(track: Partial<Track> = {}) {
	const artist = faker.music.artist()
	const album = faker.music.album()
	return addRefs({
		id: faker.number.int(),
		path: faker.system.filePath(),
		media: null,
		mediaCount: 0,
		mtimeMs: faker.date.recent().getTime(),
		agentId: null,
		...track,
		tags: track.tags
			? JSON.parse(JSON.stringify(track.tags))
			: {
					album,
					artists: [artist],
					duration: 0,
					genre: [],
					title: faker.music.songName()
				}
	}) as Track
}

export function makeTracks(length: number, track: Partial<Track> = {}) {
	return Array.from({ length }, (_, i) => makeTrack({ id: i + 1, ...track }))
}

export function bindArtists(track: Track, artists: Artist[]) {
	for (const artist of artists) {
		artist.trackIds.push(track.id)
	}
	track.tags.artists = artists.map(({ name }) => name)
	track.artistRefs = track.tags.artists.map(makeRef)
}

export function bindAlbum(track: Track, album: Album) {
	album.trackIds.push(track.id)
	track.tags.album = album.name
	track.albumRef = makeRef(track.tags.album)
}

export function makeAlbum(album: Partial<Album> = {}): Album {
	return addId({
		name: faker.music.album().toLowerCase(),
		mtimeMs: faker.date.recent().getTime(),
		agentId: faker.number.int(),
		media: null,
		mediaCount: 0,
		...album,
		trackIds: album.trackIds ? [...album.trackIds] : [faker.number.int()],
		refs: album.refs ? [...album.refs] : []
	})
}

export function makeAlbums(length: number, album: Partial<Album> = {}) {
	return Array.from({ length }, () => makeAlbum(album)).sort((a, b) =>
		a.name.localeCompare(b.name)
	)
}

export function makeArtist(artist: Partial<Artist> = {}): Artist {
	return addId({
		name: faker.music.artist().toLowerCase(),
		mtimeMs: faker.date.recent().getTime(),
		agentId: faker.number.int(),
		media: null,
		mediaCount: 0,
		...artist,
		trackIds: artist.trackIds ? [...artist.trackIds] : [faker.number.int()],
		refs: artist.refs ? [...artist.refs] : [],
		bio: artist.bio ? { ...artist.bio } : null
	})
}

export function makeArtists(length: number, artist: Partial<Artist> = {}) {
	return Array.from({ length }, () => makeArtist(artist)).sort((a, b) =>
		a.name.localeCompare(b.name)
	)
}

export function makePlaylist(playlist: Partial<Playlist> = {}): Playlist {
	return addId({
		name: faker.music.songName().toLowerCase(),
		mtimeMs: faker.date.recent().getTime(),
		media: null,
		mediaCount: 0,
		...playlist,
		trackIds: playlist.trackIds ? [...playlist.trackIds] : [faker.number.int()],
		refs: playlist.refs ? [...playlist.refs] : [],
		userIds: playlist.userIds ? [...playlist.userIds] : []
	})
}

export function makePlaylists(
	length: number,
	playlist: Partial<Playlist> = {}
) {
	return Array.from({ length }, () => makePlaylist(playlist)).sort((a, b) =>
		a.name.localeCompare(b.name)
	)
}

export function makeAgentById() {
	const agent: Agent = { id: 1, name: 'default', base: '/' }
	return new Map([[agent.id, agent]])
}
