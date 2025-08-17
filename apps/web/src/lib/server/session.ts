import { sessionsModel, usersModel } from '@melodie/common/models'
import { database } from './database'
import { compare, hash } from '@melodie/common/utils'
import { randomBytes } from 'node:crypto'

export interface Session {
	token: string
}

export async function logIn(name: string, password: string) {
	await database.init()
	const { total, results } = await usersModel.list({
		size: 1,
		searched: name,
		exactSearch: true
	})
	const user = results?.[0]
	if (total !== 1 || !(await compare(password, user.hash))) {
		throw new Error('Invalid username or password')
	}
	const token = createSession(user.id)
	return token
}

async function createSession(userId: number) {
	const id = randomId()
	const secret = randomId()

	await sessionsModel.save({
		id,
		hash: `${hash(secret)}`,
		createdAt: Date.now(),
		userId
	})
	return `${id}.${secret}`
}

function randomId() {
	// https://lucia-auth.com/sessions/basic
	const alphabet = 'abcdefghijklmnpqrstuvwxyz23456789'
	const bytes = randomBytes(24)
	let id = ''
	for (let i = 0; i < bytes.length; i++) {
		id += alphabet[bytes[i] >> 3]
	}
	return id
}

export async function recoverSession(token: string) {
	return { token }
}
