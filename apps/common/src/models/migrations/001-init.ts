import type { Database } from 'bun:sqlite'

export async function up(db: Database) {
	db.run(`
CREATE TABLE agents (
	id BIGINT PRIMARY KEY,
	base TEXT,
	name TEXT
)`)
	db.run(`
CREATE TABLE albums (
	id BIGINT PRIMARY KEY, 
	mtimeMs FLOAT,
	name TEXT,
	media TEXT NULLABLE, 
	mediaCount INTEGER DEFAULT 1, 
	trackIds JSON, 
	refs TEXT, 
	agentId BIGINT REFERENCES agents(id) ON DELETE NO ACTION
)`)
	db.run(`
CREATE TABLE artists (
	id BIGINT PRIMARY KEY, 
	mtimeMs FLOAT,
	name TEXT,
	bio JSON,
	media TEXT NULLABLE, 
	mediaCount INTEGER DEFAULT 1, 
	trackIds JSON, 
	refs TEXT, 
	agentId BIGINT REFERENCES agents(id) ON DELETE NO ACTION
)`)
	db.run(`
CREATE TABLE playlists (
	id BIGINT PRIMARY KEY, 
	mtimeMs FLOAT,
	name TEXT,
	media TEXT NULLABLE, 
	mediaCount INTEGER DEFAULT 1, 
	trackIds JSON, 
	refs TEXT, 
	trackPaths JSON
)`)
	db.run(`
CREATE TABLE tracks (
	id BIGINT PRIMARY KEY, 
	mtimeMs FLOAT,
	path TEXT,
	tags JSON, 
	media TEXT NULLABLE, 
	mediaCount INTEGER DEFAULT 1, 
	artistRefs JSON, 
	albumRef JSON,
	agentId BIGINT REFERENCES agents(id) ON DELETE NO ACTION
)`)
}
