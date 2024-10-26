import { faker } from '@faker-js/faker'
import { services as coreServices } from '@melodie/core'
import * as electron from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { exportPlaylist } from './playlists'

vi.mock('@melodie/core')
vi.mock('electron', () => ({
  dialog: {
    showSaveDialog: vi.fn()
  },
  app: {
    getPath: vi.fn().mockReturnValue('')
  }
}))

describe('Playlists service', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('export', () => {
    it('does not show save dialog on missing playlist', async () => {
      coreServices.playlists.exportPlaylist.mockResolvedValueOnce(null)
      const id = faker.number.int()

      expect(await exportPlaylist(id)).toBeNull()
      expect(coreServices.playlists.exportPlaylist).toHaveBeenCalledWith(
        id,
        expect.any(Function)
      )
      expect(electron.dialog.showSaveDialog).not.toHaveBeenCalled()
    })

    it('opens save dialog when requested', async () => {
      const tracks = [
        {
          id: faker.number.int(),
          path: faker.system.filePath()
        }
      ]
      const playlist = {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: tracks.map(({ id }) => id)
      }
      const formats = faker.helpers.arrayElements(['m3u8', 'm3u', 'pls'])
      let filePath = faker.system.filePath()

      coreServices.playlists.exportPlaylist.mockImplementation(
        async (id, selectPath) => selectPath(playlist, formats)
      )
      electron.dialog.showSaveDialog.mockResolvedValueOnce({ filePath })

      expect(await exportPlaylist(playlist.id)).toEqual(filePath)
      expect(coreServices.playlists.exportPlaylist).toHaveBeenCalledWith(
        playlist.id,
        expect.any(Function)
      )
      expect(electron.dialog.showSaveDialog).toHaveBeenCalledWith({
        defaultPath: `${playlist.name}.m3u8`,
        properties: ['createDirectory'],
        filters: [{ extensions: formats }]
      })
      expect(electron.dialog.showSaveDialog).toHaveBeenCalledOnce()
    })
  })
})
