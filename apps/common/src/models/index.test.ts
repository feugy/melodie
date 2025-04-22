import { describe, expect, it, mock } from 'bun:test'
import { faker } from '@faker-js/faker'
import type { DBConf } from '../types.ts'

describe('models', () => {
	// https://github.com/oven-sh/bun/pull/18171
	// modules are not restored after tests
	it.skip('initializes all models', async () => {
		const agentsModel = { init: mock() }
		const albumsModel = { init: mock() }
		const artistsModel = { init: mock() }
		const tracksModel = { init: mock() }
		const playlistsModel = { init: mock() }
		mock.module('./agents.ts', () => ({ agentsModel }))
		mock.module('./albums.ts', () => ({ albumsModel }))
		mock.module('./artists.ts', () => ({ artistsModel }))
		mock.module('./tracks.ts', () => ({ tracksModel }))
		mock.module('./playlists.ts', () => ({ playlistsModel }))

		const { init } = await import('./index.ts')

		const conf: DBConf = { filename: faker.system.filePath() }
		await init(conf)
		expect(agentsModel.init).toHaveBeenCalledWith(conf, true)
		expect(albumsModel.init).toHaveBeenCalledWith(conf, false)
		expect(artistsModel.init).toHaveBeenCalledWith(conf, false)
		expect(tracksModel.init).toHaveBeenCalledWith(conf, false)
		expect(playlistsModel.init).toHaveBeenCalledWith(conf, false)
	})
})
