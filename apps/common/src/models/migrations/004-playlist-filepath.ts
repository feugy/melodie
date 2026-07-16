import type { Database } from 'bun:sqlite'

export async function up(db: Database) {
	db.run(`ALTER TABLE playlists ADD COLUMN filePath TEXT`)
}
