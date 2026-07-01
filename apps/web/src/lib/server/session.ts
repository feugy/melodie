import { usersModel } from '@melodie/common/models'
import { compare, createJWT, verifyJWT } from '@melodie/common/utils'
import cookie, { type SerializeOptions } from 'cookie'
import { database } from './database'

export interface Session {
	token: string
	userId: number
	iat?: number
	exp?: number
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
	} catch {
		return
	}
}

export async function refreshSession(session: Pick<Session, 'userId'>) {
	const token = await createJWT({
		userId: session.userId,
		rotatedAt: Date.now()
	})
	return {
		token,
		...(await verifyJWT<Pick<Session, 'userId'>>(token))
	}
}

export function getTokenCookie(request: Request) {
	return cookie.parse(request.headers.get('cookie') || '').token
}

export const getTokenFromCookie = getTokenCookie

export function setTokenCookie(
	response: Response,
	token?: string,
	secure = process.env.NODE_ENV === 'production'
) {
	const options: SerializeOptions = {
		path: '/',
		secure,
		httpOnly: true,
		sameSite: 'lax'
	}
	if (token) {
		options.maxAge = 60 * 60 * 24
	} else {
		options.maxAge = 0
		options.expires = new Date(1)
	}
	response.headers.set(
		'set-cookie',
		cookie.serialize('token', token ?? '', options)
	)
	return response
}
