import type { Database } from 'bun:sqlite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { type User, UsersModel, usersModel } from './users.ts'

describe('Users model', () => {
	let db: Database
	let conf: DBConf

	const models: User[] = [
		{
			id: faker.number.int({ min: 100 }),
			name: 'john',
			hash: faker.string.alphanumeric(32),
			createdAt: Date.now() - 5000
		},
		{
			id: faker.number.int({ min: 100 }),
			name: 'jo',
			hash: faker.string.alphanumeric(32),
			createdAt: Date.now() - 3000
		}
	]

	beforeAll(async () => {
		;({ conf, db } = await initTestDB())
		await usersModel.init(conf)
	})

	afterAll(async () => {
		await UsersModel.release()
		await cleanTestTB(conf)
	})

	beforeEach(async () => {
		await usersModel.reset()
		const insert = db.prepare(
			`INSERT INTO ${usersModel.name} VALUES (:id, :name, :hash, :createdAt)`
		)
		db.transaction(models => {
			for (const model of models) {
				insert.run(model)
			}
		})(models)
	})

	it('can create a user', async () => {
		const name = faker.person.firstName()
		const hash = faker.string.alphanumeric(32)
		const createdAt = Date.now()
		expect(await usersModel.save({ name, hash, createdAt })).toEqual({
			id: expect.any(Number),
			name,
			hash,
			createdAt
		})
	})

	it('can list user by name', async () => {
		expect(
			await usersModel.list({ searched: 'Jo', exactSearch: true })
		).toEqual({
			from: 0,
			size: 10,
			total: 1,
			sort: '+name',
			results: [models[1]]
		})
	})

	it('can list users', async () => {
		expect(await usersModel.list()).toEqual(
			expect.objectContaining({
				from: 0,
				size: 10,
				total: expect.any(Number),
				sort: '+id',
				results: expect.arrayContaining(models)
			})
		)
	})

	it('can list users', async () => {
		expect(await usersModel.list()).toEqual(
			expect.objectContaining({
				from: 0,
				size: 10,
				total: expect.any(Number),
				sort: '+id',
				results: expect.arrayContaining(models)
			})
		)
	})

	it('can update user', async () => {
		const newName = faker.person.firstName()
		const [, { id, createdAt, hash }] = models
		await usersModel.save({ id, name: newName })
		expect(await usersModel.getById(id)).toEqual({
			id,
			createdAt,
			hash,
			name: newName
		})
	})

	it('can delete user', async () => {
		const [{ id }] = models
		await usersModel.removeByIds([id])
		expect(await usersModel.getById(id)).toBeNull()
	})
})
