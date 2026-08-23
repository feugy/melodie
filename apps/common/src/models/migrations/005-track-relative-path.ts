import type { Database } from 'bun:sqlite'

export async function up(db: Database) {
	db.run('ALTER TABLE tracks ADD COLUMN relativePath TEXT')

	// Backfill existing tracks using the configured music root folders.
	const settings = db
		.query<{ folders: string }, null>(
			'SELECT folders FROM settings WHERE id = 1000'
		)
		.get(null)
	if (!settings) return

	const folders: string[] = JSON.parse(settings.folders)
	if (!folders.length) return

	// Normalise each folder to always end with a slash so prefix-stripping is unambiguous,
	// longest first so nested mount-points win over their parents.
	const rootPrefixes = folders
		.map(folder => (folder.endsWith('/') ? folder : `${folder}/`))
		.sort((a, b) => b.length - a.length)

	const update = db.prepare(
		'UPDATE tracks SET relativePath = substr(path, ?) WHERE relativePath IS NULL AND substr(path, 1, ?) = ?'
	)
	db.transaction(() => {
		for (const prefix of rootPrefixes) {
			update.run(prefix.length + 1, prefix.length, prefix)
		}
	})()
}
