import { database } from '$lib/server/database'
import { agentsModel } from '@melodie/common/models'

export async function loadAgentMap() {
	await database.init()
	return new Map(
		(await agentsModel.list()).results.map(agent => [agent.id, agent])
	)
}
