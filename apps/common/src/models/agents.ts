import { AbstractModel } from './abstract-model.ts'

export interface Agent {
	id: number
	name: string
	/** base url used to retrieve data on this agent. */
	base: string
}

/** Manager for Melodie agents. */
export class AgentsModel extends AbstractModel<Agent> {
	constructor() {
		super({ name: 'agents', searchCol: 'name' })
	}
}

export const agentsModel = new AgentsModel()
