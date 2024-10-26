import { loadAgentMap } from '$lib/server'
import type { Agent } from '@melodie/common/models'
import { error } from '@sveltejs/kit'

let agentById: Map<number, Agent>

export async function GET({
	params: { agentId, kind, id, data, mediaCount },
	fetch
}) {
	if (!agentById) {
		console.log('>> fetch agents')
		agentById = await loadAgentMap()
	} else {
		console.log('>> reuse agents')
	}
	const base = agentById.get(Number.parseInt(agentId))?.base
	if (!base) {
		error(404, 'Agent not found')
	}
	const url = [base, kind, id, data, mediaCount].filter(Boolean).join('/')
	return fetch(url)
}
