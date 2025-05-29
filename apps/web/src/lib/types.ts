import type { Album, Artist } from '@melodie/common/models'

export type LightAlbum = Omit<Album, 'mtimeMs' | 'removedTrackIds' | 'trackIds'>
export type LightArtist = Omit<
	Artist,
	'mtimeMs' | 'removedTrackIds' | 'trackIds'
>
