import type { Album, Artist, Playlist } from '@melodie/common/models'

export type LightAlbum = Omit<Album, 'mtimeMs' | 'removedTrackIds'>
export type LightArtist = Omit<Artist, 'mtimeMs' | 'removedTrackIds'>
export type LightPlaylist = Omit<
	Playlist,
	'mtimeMs' | 'removedTrackIds' | 'trackPaths' | 'userIds'
>

export type Kind = 'albums' | 'artists' | 'playlists'

export interface AlbumsContext {
	get(): LightAlbum[]
	set(albums: LightAlbum[]): void
}
export interface ArtistsContext {
	get(): LightArtist[]
	set(artists: LightArtist[]): void
}
export interface PlaylistsContext {
	get(): LightPlaylist[]
	set(playlists: LightPlaylist[]): void
}
export type ScrollContext = () => Map<string, number>
