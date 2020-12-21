'use strict'

const { tmpdir } = require('os')
const { join } = require('path')
const { writeFile, readFile, remove } = require('fs-extra')
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
    it('updates HTML template, starts core service, initializes models and settings', async () => {
      const publicFolder = tmpdir()
      await writeFile(
        join(publicFolder, 'index.ejs'),
        `<html>window.serverUrl = 'ws://localhost:<%= port %>'</html>`
      )
      await remove(join(publicFolder, 'index.html'))

      const port = 8080
      const path = faker.system.filePath()
      electron.app.getPath.mockReturnValue(path)
      const close = jest.fn()
      initConnection.mockResolvedValue({ close })
      expect(await start(publicFolder, {}, {})).toEqual(close)

      expect(models.init).toHaveBeenCalledWith(join(path, 'db.sqlite3'))
      expect(models.init).toHaveBeenCalledTimes(1)
      expect(initConnection).toHaveBeenCalledWith(
        expect.any(Object),
        publicFolder,
        port
      )
      expect(services.settings.init).toHaveBeenCalledTimes(1)
      expect(services.tracks.listen).toHaveBeenCalledTimes(1)
      expect(await readFile(join(publicFolder, 'index.html'), 'utf8')).toEqual(
        `<html>window.serverUrl = 'ws://localhost:${port}'</html>`
      )
      expect(close).not.toHaveBeenCalled()
    })
  })
})
