'use strict'

const faker = require('faker')
const {
  init,
  albumsModel,
  artistsModel,
  tracksModel,
  playlistsModel,
  settingsModel
} = require('.')

jest.mock('./settings')
jest.mock('./albums')
jest.mock('./artists')
jest.mock('./tracks')
jest.mock('./playlists')

describe('models', () => {
  it('initializes all models', async () => {
    const args = faker.random.arrayElements()
    await init(...args)
    expect(settingsModel.init).toHaveBeenCalledWith(...args)
    expect(albumsModel.init).toHaveBeenCalledWith(...args)
    expect(artistsModel.init).toHaveBeenCalledWith(...args)
    expect(tracksModel.init).toHaveBeenCalledWith(...args)
    expect(playlistsModel.init).toHaveBeenCalledWith(...args)
  })
})
