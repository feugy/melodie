import type { Database } from 'bun:sqlite'

export async function up(db: Database) {
	db.run(`
CREATE TABLE users (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	hash TEXT NOT NULL,
	createdAt INTEGER NOT NULL
)`)
	db.run(`
CREATE TABLE sessions (
	id TEXT NOT NULL PRIMARY KEY,
	hash TEXT NOT NULL,
	createdAt INTEGER NOT NULL,
	userId INTEGER NOT NULL
)`)
	db.run(`ALTER TABLE playlists ADD COLUMN userIds JSON DEFAULT '[]'`)
}
