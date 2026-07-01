import type { Database } from 'bun:sqlite'
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it
} from 'bun:test'
import { faker } from '@faker-js/faker'
import { cleanTestTB, initTestDB, serializedModels } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { whereIn } from '../utils/sqlite.ts'
import { AbstractModel } from './abstract-model.ts'

const modelName = 'test'

class Test extends AbstractModel<{ tags: unknown; name?: string; id: number }> {
	constructor() {
		super({ name: modelName, jsonColumns: ['tags'], searchCol: 'name' })
	}
}

describe('Abstract model', () => {
	let db: Database
	let conf: DBConf
	const migrationsTable = '_migrations'

	beforeAll(async () => {
		;({ conf, db } = await initTestDB())
	})

	afterAll(async () => {
		await cleanTestTB(conf)
	})

	it('can not constructor model without name', () => {
		// @ts-expect-error -- Typescript validations are not enforced at runtime.
		expect(() => new AbstractModel({})).toThrow(/every model needs a name/)
	})

	describe('init()', () => {
		it('can not create init without db file', async () => {
			await expect(new Test().init()).rejects.toThrow(
				/must be initialized with a database configuration/
			)
		})

		it('triggers migrations', async () => {
			const tested = new Test()
			await tested.init(conf)
			expect(
				db.query(`SELECT name FROM sqlite_schema where type = 'table';`).all()
			).toEqual(expect.arrayContaining([{ name: migrationsTable }]))
			expect(
				db.query(`SELECT id, name FROM ${migrationsTable};`).all()
			).toEqual([
				{ id: 1, name: '001-init' },
				{ id: 2, name: '002-settings' },
				{ id: 3, name: '003-users' }
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
			db.exec(
				`CREATE TABLE ${modelName} (id BIGINT PRIMARY KEY, name TEXT, tags JSON)`
			)
			const insert = db.prepare(
				`INSERT INTO ${modelName} VALUES (:id, :name, :tags)`
			)
			db.transaction(models => {
				for (const model of models) {
					insert.run(model)
				}
			})(models)
			await tested.init(conf)
		})

		afterEach(async () => {
			db.exec(`DROP TABLE IF EXISTS ${modelName}`)
			await AbstractModel.release()
		})

		describe('reset()', () => {
			it('resets table', async () => {
				const count = db.prepare(`SELECT COUNT(*) as c FROM ${modelName}`)
				expect(count.get()).toEqual({ c: models.length })
				await tested.reset()
				expect(count.get()).toEqual({ c: 0 })
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
				expect(
					db
						.query(`SELECT * FROM ${modelName} WHERE id=:id`)
						.all({ id: model.id })
				).toEqual(serializedModels([model], tested))
			})

			it('adds multiple models', async () => {
				const models = [
					{ id: faker.number.int(), name: faker.person.fullName(), tags: {} },
					{ id: faker.number.int(), name: faker.person.fullName(), tags: {} }
				]

				await tested.save(models)
				expect(
					db
						.query(`SELECT * FROM ${modelName} WHERE ${whereIn('id', models)}`)
						.all(...models.map(({ id }) => id))
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
				for (const { tags, ...original } of originals) {
					db.run(
						`INSERT INTO ${modelName} VALUES (:id, :name, :tags)`,
						// @ts-expect-error -- TS doesn't recognize binding for tags.
						{ ...original, tags: JSON.stringify(tags) }
					)
				}

				await tested.save(models)
				expect(
					db
						.query(`SELECT * FROM ${modelName} WHERE ${whereIn('id', models)}`)
						.all(...models.map(({ id }) => id))
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
				[undefined, 'null'],
				[null, 'null'],
				[false, 'false'],
				[0, 0],
				['', '""'],
				[[], '[]'],
				[{}, '{}'],
				[true, 'true'],
				[10, 10],
				[['a', 'b'], '["a","b"]'],
				[{ foo: 'bar', baz: [1, 2] }, '{"foo":"bar","baz":[1,2]}']
			])('serializes %j as JSON data', async (tags, expected) => {
				const id = faker.number.int()
				await tested.save([{ id, tags }])
				expect(
					db.query(`SELECT * FROM ${modelName} WHERE id=:id`).get({ id })
				).toEqual({ id, name: null, tags: expected })
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

		describe('count()', () => {
			it('counts models', async () => {
				expect(await tested.count()).toBe(models.length)
			})
		})

		describe('getByIds()', () => {
			it('get model by id', async () => {
				const model = models[1]
				const results = await tested.getById(model.id)
				expect(results).toEqual({
					...model,
					tags: JSON.parse(model.tags)
				})
			})

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
					[models[0], models[3]].map(model => ({
						...model,
						tags: JSON.parse(model.tags)
					}))
				)
			})

			it('preserves duplicate ids ordering', async () => {
				const results = await tested.getByIds([
					models[2].id,
					models[0].id,
					models[2].id
				])

				expect(results).toEqual([
					{ ...models[2], tags: JSON.parse(models[2].tags) },
					{ ...models[0], tags: JSON.parse(models[0].tags) },
					{ ...models[2], tags: JSON.parse(models[2].tags) }
				])
			})

			it('throws meaningful error on deserialization error', async () => {
				const id = faker.number.int()
				db.run(
					`INSERT INTO ${modelName} VALUES (:id, :name, :tags)`,
					// @ts-expect-error -- TS doesn't recognize binding for id.
					{ id, name, tags: '{' }
				)
				await expect(tested.getByIds([id])).rejects.toThrow(
					/failed to deserialize value "{" for col tags: JSON Parse error/
				)
			})
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
				const ids = db
					.query<{ id: number }, number[]>(
						`SELECT id FROM ${modelName} WHERE ${whereIn('id', models)}`
					)
					.all(...models.map(({ id }) => id))
					.map(({ id }) => id)
				expect(ids).toEqual(
					expect.not.arrayContaining([models[0].id, models[3].id])
				)
				expect(ids).toHaveLength(2)
			})
		})
	})
})
