import type { LightAlbum } from '$lib/types'
import type { Agent, Track } from '@melodie/common/models'

export function getBase(
	model: LightAlbum | Track | undefined,
	agentById: Map<number, Agent>
) {
	return agentById.get(model?.agentId ?? -1)?.base
}

export function getImage(
	model: LightAlbum | Track | undefined,
	agentById: Map<number, Agent>
) {
	const base = getBase(model, agentById)
	return base !== undefined && model
		? `${base}/${'path' in model ? 'tracks' : 'albums'}/${model.id}/media/${model.mediaCount}`
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
