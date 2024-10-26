import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { faker } from '@faker-js/faker'
import { type Knex, knex } from 'knex'
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it
} from 'vitest'
import { cleanTestTB, initTestDB, serializedModels } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { AbstractModel } from './abstract-model.ts'

const modelName = 'test'

class Test extends AbstractModel<{ tags: unknown; name?: string; id: number }> {
	constructor() {
		super({ name: modelName, jsonColumns: ['tags'], searchCol: 'name' })
	}
}

describe.each([{ kind: 'pg' }, { kind: 'sqlite3' }])(
	'Abstract model ($kind}',
	({ kind }) => {
		let db: Knex
		let conf: DBConf
		const migrationFolder = resolve(__dirname, 'migrations')
		const allMigrations = readdirSync(migrationFolder).sort()
		const latestMigration = allMigrations[allMigrations.length - 1]
		const migrationsTable = 'knex_migrations'

		beforeAll(async () => {
			conf = await initTestDB(kind as DBConf['kind'])
			db = knex({
				client: conf.kind,
				connection: conf,
				useNullAsDefault: true,
				migrations: { directory: migrationFolder },
				log: { warn: () => {} }
			})
		})

		afterAll(async () => {
			await db.destroy()
			await cleanTestTB(conf)
		})

		it('can not constructor model without name', () => {
			// @ts-expect-error -- Typescript validations are not enforced at runtime.
			expect(() => new AbstractModel({})).toThrow(/every model needs a name/)
		})

		describe('init()', () => {
			afterEach(async () => {
				await db.schema.dropTableIfExists(migrationsTable)
				await db.schema.dropTableIfExists('albums')
				await db.schema.dropTableIfExists('artists')
				await db.schema.dropTableIfExists('tracks')
				await db.schema.dropTableIfExists('playlists')
				await db.schema.dropTableIfExists('agents')
				await AbstractModel.release()
			})

			it('can not create init without db file', async () => {
				await expect(new Test().init()).rejects.toThrow(
					/must be initialized with a database configuration/
				)
			})

			it('triggers migrations', async () => {
				const tested = new Test()
				await tested.init(conf)
				expect(await db.schema.hasTable(migrationsTable)).toBe(true)
				expect(await db(migrationsTable).select()).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: allMigrations.length,
							name: latestMigration
						})
					])
				)
			})

			it('does not trigger migration if already at the latest', async () => {
				await db.schema.createTable(migrationsTable, table => {
					table.double('id')
					table.string('name')
					table.integer('batch')
				})
				await db(migrationsTable).insert(
					allMigrations.map((name, id) => ({ id, name }))
				)

				const tested = new Test()
				await tested.init(conf)
				expect(await db(migrationsTable).count({ c: 'id' })).toEqual([
					{ c: allMigrations.length }
				])
			})
		})

		describe('given some data', () => {
			const tested = new Test()
			const name = faker.person.fullName()
			const models = [
				{ id: faker.number.int(), name, tags: '{}' },
				{ id: faker.number.int(), name: faker.person.fullName(), tags: '{}' },
				{
					id: faker.number.int(),
					name: `${name} ${faker.person.fullName()}`,
					tags: '{}'
				},
				{ id: faker.number.int(), name: faker.person.fullName(), tags: '{}' }
			]

			beforeEach(async () => {
				await db.schema.createTable(modelName, table => {
					table.double('id').primary()
					table.string('name')
					table.json('tags')
				})
				await db(modelName).insert(models)
				await tested.init(conf)
			})

			afterEach(async () => {
				if (await db.schema.hasTable(modelName)) {
					await db.schema.dropTable(modelName)
				}
				await AbstractModel.release()
			})

			describe('reset()', () => {
				it('resets table', async () => {
					expect(await db(modelName).count({ c: 'id' })).toEqual([
						{ c: models.length }
					])
					await tested.reset()
					expect(await db(modelName).count({ c: 'id' })).toEqual([{ c: 0 }])
				})
			})

			describe('save()', () => {
				it('adds single model', async () => {
					const model = {
						id: faker.number.int(),
						name: faker.person.fullName(),
						tags: {}
					}

					await tested.save(model)
					expect(await db(modelName).where({ id: model.id }).select()).toEqual(
						serializedModels([model], tested)
					)
				})

				it('adds multiple models', async () => {
					const models = [
						{ id: faker.number.int(), name: faker.person.fullName(), tags: {} },
						{ id: faker.number.int(), name: faker.person.fullName(), tags: {} }
					]

					await tested.save(models)
					expect(
						await db(modelName)
							.whereIn(
								'id',
								models.map(({ id }) => id)
							)
							.select()
					).toEqual(expect.arrayContaining(serializedModels(models, tested)))
				})

				it('update existing models', async () => {
					const originals = [
						{
							id: faker.number.int(),
							name: faker.person.fullName(),
							tags: { old: true }
						},
						{
							id: faker.number.int(),
							name: faker.person.fullName(),
							tags: { n: 10 }
						}
					]
					const models = [
						{
							id: originals[0].id,
							tags: { new: true }
						},
						{ id: originals[1].id, tags: { n: 22 } }
					]
					await db(modelName).insert(
						originals.map(original => ({
							...original,
							tags: JSON.stringify(original.tags)
						}))
					)

					await tested.save(models)
					expect(
						await db(modelName)
							.whereIn(
								'id',
								models.map(({ id }) => id)
							)
							.select()
					).toEqual(
						expect.arrayContaining(
							serializedModels(
								models.map((model, i) => ({ ...originals[i], ...model })),
								tested
							)
						)
					)
				})

				it.each([
					[undefined, kind === 'pg' ? null : 'null'],
					[null, kind === 'pg' ? null : 'null'],
					[false, kind === 'pg' ? false : 'false'],
					[0, 0],
					['', kind === 'pg' ? '' : '""'],
					[[], kind === 'pg' ? [] : '[]'],
					[{}, kind === 'pg' ? {} : '{}'],
					[true, kind === 'pg' ? true : 'true'],
					[10, 10],
					[['a', 'b'], kind === 'pg' ? ['a', 'b'] : '["a","b"]'],
					[
						{ foo: 'bar', baz: [1, 2] },
						kind === 'pg'
							? { foo: 'bar', baz: [1, 2] }
							: '{"foo":"bar","baz":[1,2]}'
					]
				])('serializes %j as JSON data', async (tags, expected) => {
					const id = faker.number.int()
					await tested.save([{ id, tags }])
					expect(await db(modelName).where({ id }).select()).toEqual([
						{ id, name: null, tags: expected }
					])
				})
			})

			describe('list()', () => {
				it('lists models', async () => {
					const { total, results, size, sort, from } = await tested.list()
					expect(results).toEqual(
						expect.arrayContaining(
							models.map(model => ({
								...model,
								tags: JSON.parse(model.tags)
							}))
						)
					)
					expect(results).toHaveLength(models.length)
					expect(total).toEqual(models.length)
					expect(size).toEqual(10)
					expect(from).toEqual(0)
					expect(sort).toEqual('+id')
				})

				it('lists models with order and pagination', async () => {
					const { total, from, size, sort, results } = await tested.list({
						size: 2,
						from: 1,
						sort: '-name'
					})
					const sorted = models.sort((m1, m2) =>
						m1.name > m2.name ? -1 : m1.name === m2.name ? 0 : 1
					)
					expect(results).toEqual(
						sorted.slice(1, 3).map(model => ({
							...model,
							tags: JSON.parse(model.tags)
						}))
					)
					expect(results).toHaveLength(size)
					expect(total).toEqual(models.length)
					expect(size).toEqual(2)
					expect(from).toEqual(1)
					expect(sort).toEqual('-name')
				})

				it('lists models with bigger size than resultset', async () => {
					const { total, from, size, sort, results } = await tested.list({
						size: 100
					})
					expect(results).toEqual(
						models
							.map(model => ({
								...model,
								tags: JSON.parse(model.tags)
							}))
							.sort((a, b) => a.id - b.id)
					)
					expect(total).toEqual(models.length)
					expect(size).toEqual(100)
					expect(from).toEqual(0)
					expect(sort).toEqual('+id')
				})

				it('lists models with out of range page', async () => {
					const { total, from, size, sort, results } = await tested.list({
						from: 10
					})
					expect(results).toEqual([])
					expect(total).toEqual(models.length)
					expect(size).toEqual(10)
					expect(from).toEqual(10)
					expect(sort).toEqual('+id')
				})

				it('get model by id', async () => {
					const model = models[1]
					const results = await tested.getById(model.id)
					expect(results).toEqual({
						...model,
						tags: JSON.parse(model.tags)
					})
				})

				it('searches models with order and pagination', async () => {
					const { total, from, size, sort, results } = await tested.list({
						size: 2,
						from: 1,
						searched: name,
						sort: '-id'
					})
					const sorted = models
						.filter(model => model.name.includes(name))
						.sort((m1, m2) =>
							m1.name > m2.name ? 1 : m1.name === m2.name ? 0 : -1
						)
					expect(results).toEqual(
						sorted.slice(1).map(model => ({
							...model,
							tags: JSON.parse(model.tags)
						}))
					)
					expect(results).toHaveLength(1)
					expect(total).toEqual(sorted.length)
					expect(size).toEqual(2)
					expect(from).toEqual(1)
					expect(sort).toEqual('+name')
				})

				it('returns empty search results page', async () => {
					const { total, from, size, sort, results } = await tested.list({
						from: 20,
						searched: name
					})
					expect(results).toEqual([])
					expect(total).toEqual(2)
					expect(size).toEqual(10)
					expect(from).toEqual(20)
					expect(sort).toEqual('+name')
				})

				it('can return empty search results', async () => {
					const { total, from, size, sort, results } = await tested.list({
						size: 2,
						from: 1,
						searched: 'unknown'
					})
					expect(results).toEqual([])
					expect(total).toEqual(0)
					expect(size).toEqual(2)
					expect(from).toEqual(1)
					expect(sort).toEqual('+name')
				})
			})

			describe('getByIds()', () => {
				it('returns null when getting unknown model by id', async () => {
					expect(await tested.getById(faker.number.int())).toBe(null)
				})

				it('gets models by ids', async () => {
					const results = await tested.getByIds([
						models[0].id,
						models[3].id,
						faker.number.int()
					])
					expect(results).toEqual(
						expect.arrayContaining(
							[models[0], models[3]].map(model => ({
								...model,
								tags: JSON.parse(model.tags)
							}))
						)
					)
					expect(results).toHaveLength(2)
				})

				if (kind !== 'pg') {
					it('throws meaningful error on deserialization error', async () => {
						const id = faker.number.int()
						await db(modelName).insert({ id, name, tags: '{' })
						await expect(tested.getByIds([id])).rejects.toThrow(
							/failed to deserialize value "{" for col tags: Expected property/
						)
					})
				}
			})

			describe('removeByIds()', () => {
				it('removes models by ids', async () => {
					const removed = await tested.removeByIds([
						models[0].id,
						models[3].id,
						faker.number.int()
					])

					expect(removed).toEqual(
						expect.arrayContaining([
							{
								...models[0],
								tags: JSON.parse(models[0].tags)
							}
						])
					)
					expect(removed).toEqual(
						expect.arrayContaining([
							{
								...models[3],
								tags: JSON.parse(models[3].tags)
							}
						])
					)
					expect(removed).toHaveLength(2)
					const ids = (
						await db(modelName)
							.select('id')
							.whereIn(
								'id',
								models.map(({ id }) => id)
							)
					).map(({ id }) => id)
					expect(ids).toEqual(
						expect.not.arrayContaining([models[0].id, models[3].id])
					)
					expect(ids).toHaveLength(2)
				})
			})
		})
	}
)
