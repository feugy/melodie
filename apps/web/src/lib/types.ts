import type { Album, Artist } from '@melodie/common/models'

export type LightAlbum = Omit<Album, 'mtimeMs' | 'removedTrackIds'>
export type LightArtist = Omit<Artist, 'mtimeMs' | 'removedTrackIds'>

export type Kind = 'albums' | 'artists'
