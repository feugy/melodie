import type { Database } from 'bun:sqlite'

export async function up(db: Database) {
	db.run(`
CREATE TABLE settings (
	id BIGINT PRIMARY KEY,
	folders TEXT,
	port INTEGER
)`)
	db.run(`
	INSERT INTO settings (id, folders, port) VALUES (1000, '[]', 80)
`)
}
