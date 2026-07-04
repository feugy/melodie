import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	setSystemTime
} from 'bun:test'
import { base } from '$app/paths'
import { faker } from '@faker-js/faker'
import { type User, init, usersModel } from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { encode } from '@melodie/common/utils'
import { handle } from './hooks.server'
import { logIn } from './lib/server/session'

describe('hooks.server.ts', () => {
	let conf: DBConf
	let user: User
	let password: string

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		password = faker.internet.password()
		user = {
			id: faker.number.int({ min: 500, max: 1000 }),
			name: 'jane',
			hash: password,
			createdAt: Date.now()
		}
		user.hash = await encode(user.hash)
		await init(conf)
		await usersModel.save(user)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
		setSystemTime()
	})

	it('resolves locale login page and sets cookie', async () => {
		const locale = 'fr'
		const resolveResponse = new Response(null, { status: 200 })
		const resolve = () => Promise.resolve(resolveResponse)
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/${locale}`),
				request: new Request(`http://localhost${base}/${locale}`),
				locals: {},
				params: { locale }
			} as never,
			resolve
		})

		expect(response.status).toBe(200)
		expect(response.headers.get('set-cookie')).toContain('token=')
	})

	it('preserves valid session on locale login page', async () => {
		const locale = 'en'
		const session = await logIn(user.name, password)
		const resolve = () =>
			Promise.resolve(
				new Response(null, {
					status: 303,
					headers: { location: `${base}/${locale}/albums` }
				})
			)
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/${locale}`),
				request: new Request(`http://localhost${base}/${locale}`, {
					headers: { cookie: `token=${session.token}` }
				}),
				locals: {},
				params: { locale }
			} as never,
			resolve
		})

		expect(response.status).toBe(303)
		expect(response.headers.get('location')).toBe(`${base}/${locale}/albums`)
		expect(response.headers.get('set-cookie')).toContain(
			`token=${session.token}`
		)
	})

	it('redirects to preferred language when locale is missing', async () => {
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/albums`),
				request: new Request(`http://localhost${base}/albums`, {
					headers: { 'accept-language': 'en-US,en;q=0.9' }
				}),
				locals: {},
				params: { locale: undefined }
			} as never,
			resolve: () => Promise.resolve(new Response(null, { status: 200 }))
		})

		expect(response.status).toBe(303)
		expect(response.headers.get('location')).toBe(`${base}/en/albums`)
	})

	it('does not rotate a session cookie automatically', async () => {
		const start = new Date('2026-01-01T00:00:00.000Z')
		setSystemTime(start)
		const session = await logIn(user.name, password)
		setSystemTime(new Date(start.getTime() + 61 * 1000))
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/en/albums`),
				request: new Request(`http://localhost${base}/en/albums`, {
					headers: { cookie: `token=${session.token}` }
				}),
				locals: {},
				params: { locale: 'en' }
			} as never,
			resolve: () => Promise.resolve(new Response(null, { status: 200 }))
		})

		expect(response.status).toBe(200)
		expect(response.headers.get('set-cookie')).toBeNull()
	})

	it('redirects invalid token to login and clears cookie', async () => {
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/en/albums`),
				request: new Request(`http://localhost${base}/en/albums`, {
					headers: { cookie: 'token=invalid-token' }
				}),
				locals: {},
				params: { locale: 'en' }
			} as never,
			resolve: () => Promise.resolve(new Response(null, { status: 200 }))
		})

		expect(response.status).toBe(303)
		expect(response.headers.get('location')).toBe(`${base}/en`)
		const setCookie = response.headers.get('set-cookie')
		expect(setCookie).toContain('token=')
		expect(setCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
	})

	it('returns 401 for API route with invalid token and clears cookie', async () => {
		const response = await handle({
			event: {
				url: new URL(`http://localhost${base}/api/get-tracks`),
				request: new Request(`http://localhost${base}/api/get-tracks`, {
					method: 'POST',
					headers: { cookie: 'token=invalid-token' }
				}),
				locals: {},
				params: { locale: undefined }
			} as never,
			resolve: () => Promise.resolve(new Response(null, { status: 200 }))
		})

		expect(response.status).toBe(401)
		expect(response.headers.get('location')).toBeNull()
		expect(response.headers.get('content-type')).toContain('application/json')
		expect(await response.json()).toEqual({ message: 'Unauthorized' })
		const setCookie = response.headers.get('set-cookie')
		expect(setCookie).toContain('token=')
		expect(setCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
	})
})
