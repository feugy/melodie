import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	setSystemTime
} from 'bun:test'
import { faker } from '@faker-js/faker'
import { type User, init, usersModel } from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { encode, verifyJWT } from '@melodie/common/utils'
import {
	getTokenCookie,
	logIn,
	recoverSession,
	refreshSession,
	setTokenCookie
} from './session'

describe('session server utils', () => {
	let conf: DBConf

	const password = faker.internet.password()
	const john: User = {
		id: faker.number.int({ min: 500, max: 1000 }),
		name: 'john',
		hash: password,
		createdAt: Date.now()
	}

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await init(conf)
		const users = [john]
		for (const user of users) {
			user.hash = await encode(user.hash)
		}
		await usersModel.save(users)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	afterEach(() => {
		setSystemTime()
	})

	describe('logIn()', () => {
		it('creates a JWT session payload', async () => {
			const session = await logIn(john.name, password)
			expect(session).toEqual({
				token: expect.any(String),
				userId: john.id
			})

			const payload = await verifyJWT<{ userId: number }>(session.token)
			expect(payload.userId).toBe(john.id)
		})

		it('does not create session for unknown user', async () => {
			await expect(logIn('unknown-user', password)).rejects.toThrow(
				'Invalid username or password'
			)
		})

		it('does not create session for an invalid password', async () => {
			await expect(logIn(john.name, 'wrong-password')).rejects.toThrow(
				'Invalid username or password'
			)
		})
	})

	describe('refreshSession()', () => {
		it('rotates the token and keeps user identity', async () => {
			const start = new Date('2026-01-01T00:00:00.000Z')
			setSystemTime(start)
			const session = await logIn(john.name, password)
			const recovered = await recoverSession(session.token)
			expect(recovered).toBeDefined()
			expect(recovered?.iat).toBeDefined()

			setSystemTime(new Date(start.getTime() + 1000))
			const refreshed = await refreshSession({ userId: recovered?.userId ?? 0 })
			expect(refreshed?.token).not.toBe(session.token)
			expect(refreshed?.userId).toBe(john.id)
			expect(refreshed?.iat).toBeGreaterThan(recovered?.iat ?? 0)
		})

		it('sets exp around 15 minutes in the future', async () => {
			const start = new Date('2026-01-01T00:00:00.000Z')
			setSystemTime(start)
			const refreshed = await refreshSession({ userId: john.id })

			const nowSeconds = Math.floor(start.getTime() / 1000)
			const fifteenMinutes = 15 * 60
			expect(refreshed.exp).toBeDefined()
			expect(refreshed.exp).toBeGreaterThan(refreshed.iat ?? 0)
			expect(refreshed.exp).toBeGreaterThanOrEqual(nowSeconds + fifteenMinutes - 1)
			expect(refreshed.exp).toBeLessThanOrEqual(nowSeconds + fifteenMinutes + 1)
		})

		it('keeps identity and increases iat and exp on consecutive refreshes', async () => {
			const start = new Date('2026-01-01T00:00:00.000Z')
			setSystemTime(start)

			const first = await refreshSession({ userId: john.id })
			setSystemTime(new Date(start.getTime() + 2000))
			const second = await refreshSession({ userId: john.id })

			expect(first.userId).toBe(john.id)
			expect(second.userId).toBe(john.id)
			expect(second.token).not.toBe(first.token)
			expect(second.iat).toBeGreaterThan(first.iat ?? 0)
			expect(second.exp).toBeGreaterThan(first.exp ?? 0)
		})
	})

	describe('getTokenCookie()', () => {
		it('reads token from cookie header', () => {
			expect(
				getTokenCookie(
					new Request('https://melodie.local/api/auth/refresh', {
						headers: {
							cookie: 'token=session-token; theme=dark'
						}
					})
				)
			).toBe('session-token')
		})

		it('returns undefined when token cookie is absent', () => {
			expect(
				getTokenCookie(
					new Request('https://melodie.local/api/auth/refresh', {
						headers: {
							cookie: 'theme=dark'
						}
					})
				)
			).toBeUndefined()
		})

		it('returns undefined when cookie is absent', () => {
			expect(
				getTokenCookie(new Request('https://melodie.local/api/auth/refresh'))
			).toBeUndefined()
		})
	})

	describe('setTokenCookie()', () => {
		it('sets token cookie with expected attributes', () => {
			const response = new Response(null, { status: 204 })
			setTokenCookie(response, 'abc123')

			const setCookie = response.headers.get('set-cookie')
			expect(setCookie).toContain('token=abc123')
			expect(setCookie).toContain('Max-Age=86400')
			expect(setCookie).toContain('Path=/')
			expect(setCookie).toContain('HttpOnly')
			expect(setCookie).toContain('SameSite=Lax')
		})

		it('clears token cookie when token is missing', () => {
			const response = new Response(null, { status: 204 })
			setTokenCookie(response)

			const setCookie = response.headers.get('set-cookie')
			expect(setCookie).toContain('token=')
			expect(setCookie).toContain('Expires=')
		})
	})
})
