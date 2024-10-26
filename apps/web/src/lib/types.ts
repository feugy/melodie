import type { Album, Track } from '@melodie/common/models'

export type LightAlbum = Pick<
	Album,
	'id' | 'name' | 'media' | 'mediaCount' | 'agentId' | 'refs'
>

export type AssetData = 'media' | 'data'
export type AssetKind = 'tracks' | 'albums'
