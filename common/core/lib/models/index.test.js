import { faker } from '@faker-js/faker'
import { describe, expect, it, vi } from 'vitest'

import * as models from '.'

vi.mock('./settings')
vi.mock('./albums')
vi.mock('./artists')
vi.mock('./tracks')
vi.mock('./playlists')

describe('models', () => {
  it('initializes all models', async () => {
    const args = faker.helpers.arrayElement(['cat', 'dog', 'mouse'])
    await models.init(...args)
    expect(models.settingsModel.init).toHaveBeenCalledWith(...args)
    expect(models.albumsModel.init).toHaveBeenCalledWith(...args)
    expect(models.artistsModel.init).toHaveBeenCalledWith(...args)
    expect(models.tracksModel.init).toHaveBeenCalledWith(...args)
    expect(models.playlistsModel.init).toHaveBeenCalledWith(...args)
  })
})
