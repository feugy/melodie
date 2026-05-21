import type { Database } from 'bun:sqlite'
import { isNativeError } from 'node:util/types'
import { type Logger, getLogger } from './logger.ts'

const migrationsTable = '_migrations'

export interface Migration {
	name: string
	up: (db: Database) => Promise<void>
}

interface MigrationRaw {
	name: string
}

async function ensureTable(db: Database) {
	db.exec(`
CREATE TABLE IF NOT EXISTS \`${migrationsTable}\` (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
  name TEXT, 
  time INTEGER
)
  `)
}

async function listCompleted(db: Database, logger: Logger) {
	const migrations = db
		.query<MigrationRaw, []>(
			`SELECT id, name, time FROM ${migrationsTable} ORDER BY id`
		)
		.all()
	logger.debug('completed migrations', { migrations })
	return migrations.map(({ name }) => name)
}

async function applyMigration(
	{ name, up }: Migration,
	db: Database,
	logger: Logger
) {
	logger.debug(`applying migration ${name}`, { name })
	try {
		await up(db)
		logger.debug('inserting into migration table', { name })
		db.prepare(
			`INSERT INTO ${migrationsTable} (name, time) VALUES (:name, :time)`
		).run({ name, time: Date.now() })
		logger.info(`migration ${name} applied`, { name })
	} catch (error) {
		logger.error(
			`Failed to apply migration ${name}: ${isNativeError(error) ? error.message : error}`,
			{ name, error }
		)
		throw error
	}
}

export async function migrateToLatest(db: Database, migrations: Migration[]) {
	const logger = getLogger('migrations')
	await ensureTable(db)
	const completed = await listCompleted(db, logger)
	const all = migrations.toSorted(
		({ name: a }, { name: b }) => Number.parseInt(a) - Number.parseInt(b)
	)
	const pending = all.filter(({ name }) => !completed.includes(name))
	for (const migration of pending) {
		await applyMigration(migration, db, logger)
	}
}

export async function getCurrentVersion(db: Database) {
	try {
		return (
			db
				.query<{ name: string }, []>(
					`SELECT name FROM ${migrationsTable} ORDER BY id DESC LIMIT 1`
				)
				.get()?.name ?? 'none'
		)
	} catch (error) {
		if (isNativeError(error) && error.message.includes('no such table')) {
			return 'none'
		}
		throw error
	}
}
