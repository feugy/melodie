'use strict'

const { join } = require('path')
const electron = require('electron')
const faker = require('faker')
const {
  models,
  services,
  utils: { initConnection }
} = require('@melodie/core')
const { start } = require('.')
const playlists = require('./playlists')
const settings = require('./settings')
const tracks = require('./tracks')
const { focusOnNotification } = require('../utils')

jest.mock('@melodie/core')
jest.mock('../utils/window-state')

describe('Services', () => {
  beforeEach(jest.resetAllMocks)

  it('starts core service, initializes models and settings', async () => {
    const publicFolder = faker.system.filePath()
    const port1 = faker.random.number()
    const port2 = faker.random.number()
    const path = faker.system.filePath()
    electron.app.getPath.mockReturnValue(path)
    const close = jest.fn()
    initConnection.mockResolvedValue({
      close,
      address: `ws:localhost:${port2}`
    })
    expect(await start(publicFolder, {}, {}, port1)).toEqual({
      close,
      port: port2
    })

    expect(models.init).toHaveBeenCalledWith(join(path, 'db.sqlite3'))
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(initConnection).toHaveBeenCalledWith(
      {
        playlists,
        settings,
        tracks,
        media: services.media,
        core: expect.any(Object)
      },
      publicFolder,
      port1
    )
    expect(services.settings.init).toHaveBeenCalledTimes(1)
    expect(services.settings.init).toHaveBeenCalledWith(port2)
    expect(services.tracks.listen).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()
  })

  describe('given initialization', () => {
    let services
    const window = { foo: 'bar' }
    const name = faker.random.word()
    const version = faker.system.semver()

    beforeEach(async () => {
      electron.app.getPath.mockReturnValue(faker.system.filePath())
      initConnection.mockResolvedValue({ address: faker.internet.url() })
      await start('', window, { name, version })
      services = initConnection.mock.calls[0][0]
    })

    it('exposes core.getVersions()', async () => {
      expect(await services.core.getVersions()).toHaveProperty(name, version)
    })

    it('exposes core.focusWindow()', async () => {
      await services.core.focusWindow()
      expect(focusOnNotification).toHaveBeenCalledWith(window)
      expect(focusOnNotification).toHaveBeenCalledTimes(1)
    })
  })
})
