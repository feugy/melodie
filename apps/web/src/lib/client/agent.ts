import type { LightAlbum, LightArtist } from '$lib/types'
import type { Agent, Track } from '@melodie/common/models'

export function getBase(
	model: LightAlbum | LightArtist | Track | undefined,
	agentById: Map<number, Agent>
) {
	return agentById.get(model?.agentId ?? -1)?.base
}

export function getImage(
	model: LightAlbum | LightArtist | Track | undefined,
	agentById: Map<number, Agent>,
	kind?: 'album' | 'artist' | 'track'
) {
	const appliedKind = kind ?? (model && 'path' in model ? 'track' : 'album')
	const base = getBase(model, agentById)
	return base !== undefined && model
		? `${base}/${appliedKind}s/${model.id}/media/${model.mediaCount}`
		: undefined
}

export function getData(
	model: Track | undefined,
	agentById: Map<number, Agent>
) {
	const base = getBase(model, agentById)
	return base !== undefined && model
		? `${base}/tracks/${model.id}/data`
		: undefined
}
