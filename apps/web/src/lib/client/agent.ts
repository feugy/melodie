import type { Kind, LightAlbum, LightArtist, LightPlaylist } from '$lib/types'
import type { Agent, Track } from '@melodie/common/models'

function getBase(
	model: LightAlbum | LightArtist | LightPlaylist | Track | undefined,
	agentById: Map<number, Agent>
) {
	return model && 'agentId' in model && model.agentId
		? agentById.get(model.agentId)?.base
		: undefined
}

export function getImage(
	model: LightAlbum | LightArtist | LightPlaylist | Track | undefined,
	agentById: Map<number, Agent>,
	kind?: Kind | 'tracks'
) {
	const appliedKind = kind ?? (model && 'path' in model ? 'tracks' : 'albums')
	const base = getBase(model, agentById)
	return base !== undefined && model
		? `${base}/${appliedKind}/${model.id}/media/${model.mediaCount}`
		: undefined
}

export function getAudioURL(
	model: Track | undefined,
	agentById: Map<number, Agent>
) {
	const base = getBase(model, agentById)
	return base !== undefined && model
		? `${base}/tracks/${model.id}/data`
		: undefined
}
