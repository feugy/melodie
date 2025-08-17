import { AbstractModel } from './abstract-model.ts'

export interface Session {
	id: string
	hash: string
	createdAt: number
	userId: number
}

export class SessionsModel extends AbstractModel<Session> {
	constructor() {
		super({ name: 'sessions' })
	}
}

export const sessionsModel = new SessionsModel()
