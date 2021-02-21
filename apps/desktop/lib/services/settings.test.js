'use strict'

const faker = require('faker')
const electron = require('electron')
const {
  services,
  utils: { getLogger }
} = require('@melodie/core')
const settingsService = require('./settings')

jest.mock('@melodie/core')
jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  },
  app: {
    getPath: jest.fn().mockReturnValue('')
  }
}))

describe('Settings service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getLogger.mockReturnValue({ debug() {} })
  })

  describe('addFolders', () => {
    it('opens folder dialog and adds selection', async () => {
      const settings = { foo: faker.random.word() }
      const filePaths = [faker.system.fileName(), faker.system.fileName()]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })
      services.settings.addFolders.mockResolvedValueOnce(settings)

      expect(await settingsService.addFolders()).toEqual(settings)

      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
        properties: ['openDirectory', 'multiSelections']
      })
      expect(services.settings.addFolders).toHaveBeenCalledWith(filePaths)
    })

    it('does not add empty selection', async () => {
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths: [] })

      expect(await settingsService.addFolders()).toEqual(null)

      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
        properties: ['openDirectory', 'multiSelections']
      })
      expect(services.settings.addFolders).not.toHaveBeenCalled()
    })
  })
})
