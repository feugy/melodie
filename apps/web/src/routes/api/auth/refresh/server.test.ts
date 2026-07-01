import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import { type User, init, usersModel } from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { logIn } from '$lib/server'
import { encode } from '@melodie/common/utils'
import { POST } from './+server'

describe('POST /api/auth/refresh', () => {
	let conf: DBConf
	let user: User
	let password: string

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		password = faker.internet.password()
		user = {
			id: faker.number.int({ min: 500, max: 1000 }),
			name: 'refresh-user',
			hash: password,
			createdAt: Date.now()
		}
		user.hash = await encode(user.hash)
		await init(conf)
		await usersModel.save(user)
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('returns 401 when no session exists', async () => {
		const response = await POST({ locals: {} } as Parameters<typeof POST>[0])

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ message: 'Unauthorized' })
	})

	it('refreshes a valid session and sets a new cookie', async () => {
		const existingSession = await logIn(user.name, password)
		const response = await POST({
			locals: { session: existingSession }
		} as Parameters<typeof POST>[0])

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ exp: expect.any(Number) })
		const setCookie = response.headers.get('set-cookie')
		expect(setCookie).toContain('token=')
		expect(setCookie).toMatch(/token=[^;]+/)
		expect(setCookie).not.toContain(existingSession.token)
	})
})
