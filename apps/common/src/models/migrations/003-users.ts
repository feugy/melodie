import type { Database } from 'bun:sqlite'
import { generateJWTKey } from '../../utils/jwt.ts'

export async function up(db: Database) {
	db.run(`
CREATE TABLE users (
	id INTEGER PRIMARY KEY,
	name TEXT,
	hash TEXT,
	createdAt INTEGER
)`)
	db.run(`ALTER TABLE playlists ADD COLUMN userIds JSON DEFAULT '[]'`)
	db.run(
		`ALTER TABLE settings ADD COLUMN jwtKey TEXT DEFAULT '${await generateJWTKey()}'`
	)
}
