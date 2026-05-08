import { usersModel } from '@melodie/common/models'
import { compare, createJWT, verifyJWT } from '@melodie/common/utils'
import { database } from './database'

export interface Session {
	token: string
	userId: number
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
	const token = await createJWT({ userId: user.id })
	return { token, userId: user.id }
}

export async function recoverSession(token?: string) {
	if (!token) {
		return
	}
	try {
		return { token, ...(await verifyJWT<Pick<Session, 'userId'>>(token)) }
	} catch (e) {
		console.log('>>> error', e)
		return
	}
}
