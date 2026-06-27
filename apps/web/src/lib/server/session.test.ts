import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import { type User, init, usersModel } from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { encode, verifyJWT } from '@melodie/common/utils'
import { logIn } from './session'

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
})
