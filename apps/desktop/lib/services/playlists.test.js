'use strict'

const faker = require('faker')
const electron = require('electron')
const { services } = require('@melodie/core')
const playlistsService = require('./playlists')

jest.mock('@melodie/core')
jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn()
  },
  app: {
    getPath: jest.fn().mockReturnValue('')
  }
}))

describe('Playlists service', () => {
  beforeEach(jest.resetAllMocks)

  describe('export', () => {
    it('does not show save dialog on missing playlist', async () => {
      services.playlists.export.mockResolvedValueOnce(null)
      const id = faker.random.number()

      expect(await playlistsService.export(id)).toBeNull()
      expect(services.playlists.export).toHaveBeenCalledWith(
        id,
        expect.any(Function)
      )
      expect(electron.dialog.showSaveDialog).not.toHaveBeenCalled()
    })

    it('opens save dialog when requested', async () => {
      const tracks = [
        {
          id: faker.random.number(),
          path: faker.system.filePath()
        }
      ]
      const playlist = {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: tracks.map(({ id }) => id)
      }
      const formats = faker.random.arrayElements()
      let filePath = faker.system.filePath()

      services.playlists.export.mockImplementation(async (id, selectPath) =>
        selectPath(playlist, formats)
      )
      electron.dialog.showSaveDialog.mockResolvedValueOnce({ filePath })

      expect(await playlistsService.export(playlist.id)).toEqual(filePath)
      expect(services.playlists.export).toHaveBeenCalledWith(
        playlist.id,
        expect.any(Function)
      )
      expect(electron.dialog.showSaveDialog).toHaveBeenCalledWith({
        defaultPath: `${playlist.name}.m3u8`,
        properties: ['createDirectory'],
        filters: [{ extensions: formats }]
      })
      expect(electron.dialog.showSaveDialog).toHaveBeenCalledTimes(1)
    })
  })
})
