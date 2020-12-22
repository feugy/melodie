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

jest.mock('@melodie/core')

describe('Services', () => {
  beforeEach(jest.resetAllMocks)

  describe('start()', () => {
    it('starts core service, initializes models and settings', async () => {
      const publicFolder = faker.system.filePath()
      const port = faker.random.number()
      const path = faker.system.filePath()
      electron.app.getPath.mockReturnValue(path)
      const close = jest.fn()
      initConnection.mockResolvedValue({ close })
      expect(await start(port, publicFolder, {}, {})).toEqual(close)

      expect(models.init).toHaveBeenCalledWith(join(path, 'db.sqlite3'))
      expect(models.init).toHaveBeenCalledTimes(1)
      expect(initConnection).toHaveBeenCalledWith(
        expect.any(Object), // TODO
        publicFolder,
        port
      )
      expect(services.settings.init).toHaveBeenCalledTimes(1)
      expect(services.tracks.listen).toHaveBeenCalledTimes(1)
      expect(close).not.toHaveBeenCalled()
    })
  })
})
