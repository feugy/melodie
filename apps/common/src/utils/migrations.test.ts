import { Database } from 'bun:sqlite'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import {
	type Migration,
	getCurrentVersion,
	migrateToLatest
} from './migrations.ts'

describe('given a database', () => {
	let db: Database
	const migrationTable = '_migrations'

	beforeEach(() => {
		db = new Database(':memory:', { strict: true, create: true })
	})

	afterEach(() => {
		db.close()
	})

	describe('migrateToLatest()', () => {
		it('creates migration table', async () => {
			await migrateToLatest(db, [])
			expect(
				db
					.query(
						`SELECT name FROM sqlite_master WHERE type="table" AND name="${migrationTable}"`
					)
					.all()
			).toEqual([{ name: migrationTable }])
		})

		it('reports failing migration and does not update table', async () => {
			const failure = new Error('failure')
			const m1: Migration = { name: '001', up: mock() }
			const m2: Migration = {
				name: '002',
				up: mock().mockRejectedValueOnce(failure)
			}
			const m3: Migration = { name: '003', up: mock() }
			await expect(migrateToLatest(db, [m1, m2, m3])).rejects.toThrow(failure)
			expect(
				db.query(`SELECT name FROM ${migrationTable} ORDER BY id`).all()
			).toEqual([{ name: m1.name }])
			expect(m1.up).toHaveBeenCalledWith(db)
			expect(m1.up).toHaveBeenCalledTimes(1)
			expect(m2.up).toHaveBeenCalledWith(db)
			expect(m2.up).toHaveBeenCalledTimes(1)
			expect(m3.up).not.toHaveBeenCalled()
		})

		describe('given some migrations', () => {
			const m1: Migration = {
				name: '001',
				up: async db => {
					db.exec('CREATE TABLE blog (content TEXT);')
				}
			}
			const m2: Migration = {
				name: '002',
				up: async db => {
					db.exec(`INSERT INTO blog VALUES ('article 1');`)
				}
			}
			const m3: Migration = {
				name: '003',
				up: async db => {
					db.exec(`INSERT INTO blog VALUES ('article 2');`)
				}
			}

			it('applies all migrations', async () => {
				await migrateToLatest(db, [m1, m2, m3])
				expect(
					db.query(`SELECT name FROM ${migrationTable} ORDER BY id`).all()
				).toEqual([{ name: m1.name }, { name: m2.name }, { name: m3.name }])
				expect(db.query('SELECT * FROM blog').all()).toEqual([
					{ content: 'article 1' },
					{ content: 'article 2' }
				])
			})

			it('applies only new migrations', async () => {
				await migrateToLatest(db, [m1, m2])
				expect(
					db.query(`SELECT name FROM ${migrationTable} ORDER BY id`).all()
				).toEqual([{ name: m1.name }, { name: m2.name }])
				expect(db.query('SELECT * FROM blog').all()).toEqual([
					{ content: 'article 1' }
				])

				await migrateToLatest(db, [m1, m2, m3])
				expect(
					db.query(`SELECT name FROM ${migrationTable} ORDER BY id`).all()
				).toEqual([{ name: m1.name }, { name: m2.name }, { name: m3.name }])
				expect(db.query('SELECT * FROM blog').all()).toEqual([
					{ content: 'article 1' },
					{ content: 'article 2' }
				])
			})

			it('applies migrations in order', async () => {
				await migrateToLatest(db, [m2, m1])
				expect(
					db.query(`SELECT name FROM ${migrationTable} ORDER BY id`).all()
				).toEqual([{ name: m1.name }, { name: m2.name }])
			})
		})
	})

	describe('getCurrentVersion()', () => {
		it('returns none on empty database', async () => {
			expect(await getCurrentVersion(db)).toBe('none')
		})

		it('returns none on database with empty migration table', async () => {
			db.exec(`
  CREATE TABLE IF NOT EXISTS ${migrationTable} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    time INTEGER
  )
    `)
			expect(await getCurrentVersion(db)).toBe('none')
		})

		it('returns the last available version', async () => {
			db.exec(`
  CREATE TABLE IF NOT EXISTS ${migrationTable} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    time INTEGER
  );
  INSERT INTO ${migrationTable} (name, time) VALUES ('001', 123456789);
  INSERT INTO ${migrationTable} (name, time) VALUES ('002', 987654321);
    `)
			expect(await getCurrentVersion(db)).toBe('002')
		})
	})
})
