import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import {
	type User,
	init,
	sessionsModel,
	usersModel
} from '@melodie/common/models'
import { cleanTestTB, initTestDB } from '@melodie/common/tests'
import type { DBConf } from '@melodie/common/types'
import { encode, hash } from '@melodie/common/utils'
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
		it('creates a session', async () => {
			const token = await logIn(john.name, password)
			expect(token).toBeDefined()
			const [sessionId, secretHash] = token.split('.')
			const session = await sessionsModel.getById(sessionId)
			expect(session).not.toBeNull()
			expect(session?.hash).toBe(`${hash(secretHash)}`)
		})

		it.todo('deletes existing session')

		it.todo('does not create session for unknown user')

		it.todo('does not create session for an invalide password')
	})
})
