import { describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import { buildUpsert, whereIn } from './sqlite.ts'

describe('whereIn()', () => {
	it('returns an empty string for empty array', () => {
		expect(whereIn(faker.database.column(), [])).toBe('')
	})

	it('insert as many placeholders as the array length', () => {
		const column = faker.database.column()
		expect(whereIn(column, [1, 2, 3])).toBe(`${column} IN (?,?,?)`)
	})
})

describe('buildUpsert()', () => {
	it('throws on empty array', () => {
		const table = faker.database.column()
		expect(() => buildUpsert(table, [])).toThrow(
			`Can not upsert in ${table} without models`
		)
	})

	it('does not include id in upserted fields', () => {
		const table = faker.database.column()
		const models = [
			{
				id: faker.string.uuid(),
				f1: faker.string.alpha(),
				f2: faker.number.int()
			},
			{
				id: faker.string.uuid(),
				f1: faker.string.alpha(),
				f2: faker.number.int()
			}
		]
		expect(
			buildUpsert(table, models)
		).toEqual(`INSERT INTO ${table} (id, f1, f2) 
VALUES (:id, :f1, :f2)
ON CONFLICT(id) DO UPDATE SET
f1=coalesce(excluded.f1, NULL),
f2=coalesce(excluded.f2, NULL)`)
	})

	it('includes all fields of all models without duplicates', () => {
		const table = faker.database.column()
		const models = [
			{
				id: faker.string.uuid(),
				f1: faker.string.alpha(),
				f2: faker.number.int()
			},
			{
				id: faker.string.uuid(),
				f2: faker.number.int(),
				f3: faker.string.alpha()
			}
		]
		expect(
			buildUpsert(table, models)
		).toEqual(`INSERT INTO ${table} (id, f1, f2, f3) 
VALUES (:id, :f1, :f2, :f3)
ON CONFLICT(id) DO UPDATE SET
f1=coalesce(excluded.f1, NULL),
f2=coalesce(excluded.f2, NULL),
f3=coalesce(excluded.f3, NULL)`)
	})
})
