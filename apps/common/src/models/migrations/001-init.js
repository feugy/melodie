export async function up(db) {
	const isPg = db.context.client.connectionSettings.kind === 'pg'
	await db.schema
		.createTable('agents', table => {
			table[isPg ? 'double' : 'bigInteger']('id').primary()
			table.text('base')
			table.text('name')
		})
		.createTable('albums', table => {
			table[isPg ? 'double' : 'bigInteger']('id').primary()
			table.double('mtimeMs')
			table.text('name')
			table.text('media')
			table.integer('mediaCount').defaultTo(1)
			table.json('trackIds')
			table.json('refs')
			table[isPg ? 'double' : 'bigInteger']('agentId')
				.references('agents.id')
				.onDelete('NO ACTION')
		})
		.createTable('artists', table => {
			table[isPg ? 'double' : 'bigInteger']('id').primary()
			table.double('mtimeMs')
			table.text('name')
			table.json('bio')
			table.text('media')
			table.integer('mediaCount').defaultTo(1)
			table.json('trackIds')
			table.json('refs')
			table[isPg ? 'double' : 'bigInteger']('agentId')
				.references('agents.id')
				.onDelete('NO ACTION')
		})
		.createTable('playlists', table => {
			table[isPg ? 'double' : 'bigInteger']('id').primary()
			table.double('mtimeMs')
			table.text('name')
			table.text('media')
			table.integer('mediaCount').defaultTo(1)
			table.json('trackIds')
			table.json('refs')
			table.json('trackPaths')
		})
		.createTable('tracks', table => {
			table[isPg ? 'double' : 'bigInteger']('id').primary()
			table.double('mtimeMs')
			table.text('path')
			table.json('tags')
			table.text('media')
			table.integer('mediaCount').defaultTo(1)
			table.json('artistRefs')
			table.json('albumRef')
			table[isPg ? 'double' : 'bigInteger']('agentId')
				.references('agents.id')
				.onDelete('NO ACTION')
		})
}

export async function down({ schema }) {
	await schema
		.dropTable('tracks')
		.dropTable('playlists')
		.dropTable('artists')
		.dropTable('albums')
		.dropTable('agents')
}
