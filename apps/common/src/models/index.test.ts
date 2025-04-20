import { faker } from '@faker-js/faker'
import { describe, expect, it, vi } from 'vitest'
import type { DBConf } from '../types.ts'
import {
	agentsModel,
	albumsModel,
	artistsModel,
	init,
	playlistsModel,
	tracksModel
} from './index.ts'

vi.mock('./agents.ts')
vi.mock('./albums.ts')
vi.mock('./artists.ts')
vi.mock('./tracks.ts')
vi.mock('./playlists.ts')

describe('models', () => {
	it('initializes all models', async () => {
		const conf: DBConf = {
			kind: 'sqlite3',
			filename: faker.system.filePath()
		}
		await init(conf)
		expect(agentsModel.init).toHaveBeenCalledWith(conf, true)
		expect(albumsModel.init).toHaveBeenCalledWith(conf, false)
		expect(artistsModel.init).toHaveBeenCalledWith(conf, false)
		expect(tracksModel.init).toHaveBeenCalledWith(conf, false)
		expect(playlistsModel.init).toHaveBeenCalledWith(conf, false)
	})
})
