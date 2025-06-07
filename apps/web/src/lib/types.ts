import type { Album, Artist } from '@melodie/common/models'

export type LightAlbum = Omit<Album, 'mtimeMs' | 'removedTrackIds'>
export type LightArtist = Omit<Artist, 'mtimeMs' | 'removedTrackIds'>

export type Kind = 'albums' | 'artists'

export interface AlbumsContext {
	get(): LightAlbum[]
	set(albums: LightAlbum[]): void
}
export interface ArtistsContext {
	get(): LightArtist[]
	set(artists: LightArtist[]): void
}
export type ScrollContext = () => Map<string, number>
