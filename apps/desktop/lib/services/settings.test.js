import { faker } from '@faker-js/faker'
import { utils } from '@melodie/core'
import { services as coreServices } from '@melodie/core'
import * as electron from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addFolders } from './settings'

vi.mock('@melodie/core')
vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn()
  },
  app: {
    getPath: vi.fn().mockReturnValue('')
  }
}))

describe('Settings service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    utils.getLogger.mockReturnValue({ debug() {} })
  })

  describe('addFolders', () => {
    it('opens folder dialog and adds selection', async () => {
      const settings = { foo: faker.lorem.word() }
      const filePaths = [faker.system.fileName(), faker.system.fileName()]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })
      coreServices.settings.addFolders.mockResolvedValueOnce(settings)

      expect(await addFolders()).toEqual(settings)

      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
        properties: ['openDirectory', 'multiSelections']
      })
      expect(coreServices.settings.addFolders).toHaveBeenCalledWith(filePaths)
    })

    it('does not add empty selection', async () => {
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths: [] })

      expect(await addFolders()).toBeNull()

      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
        properties: ['openDirectory', 'multiSelections']
      })
      expect(coreServices.settings.addFolders).not.toHaveBeenCalled()
    })
  })
})
