import { loadAgentMap } from '$lib/server'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
	return {
		agentById: await loadAgentMap()
	}
}
