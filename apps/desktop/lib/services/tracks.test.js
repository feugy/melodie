'use strict'

const faker = require('faker')
const electron = require('electron')
const { models } = require('@melodie/core')
const tracksService = require('./tracks')

jest.mock('@melodie/core')
jest.mock('electron', () => ({ shell: { showItemInFolder: jest.fn() } }))

describe('Tracks service', () => {
  beforeEach(jest.resetAllMocks)

  describe('openContainingFolder', () => {
    it(`opens model's containing folder`, async () => {
      const model = { path: faker.system.commonFileName() }
      models.tracksModel.getById.mockResolvedValueOnce(model)
      const id = faker.random.number()

      await tracksService.openContainingFolder(id)
      expect(models.tracksModel.getById).toHaveBeenCalledWith(id)
      expect(models.tracksModel.getById).toHaveBeenCalledTimes(1)
      expect(electron.shell.showItemInFolder).toHaveBeenCalledWith(model.path)
      expect(electron.shell.showItemInFolder).toHaveBeenCalledTimes(1)
    })

    it(`handles model with special characters in pathr`, async () => {
      const model = {
        path:
          '/home/damien/Musique/# Films/(2001) The Lord Of The Rings - The Fellowship Of The Ring/1 - Howard Shore - The Prophecy.flac'
      }
      models.tracksModel.getById.mockResolvedValueOnce(model)
      const id = faker.random.number()

      await tracksService.openContainingFolder(id)
      expect(models.tracksModel.getById).toHaveBeenCalledWith(id)
      expect(models.tracksModel.getById).toHaveBeenCalledTimes(1)
      expect(electron.shell.showItemInFolder).toHaveBeenCalledWith(
        '/home/damien/Musique/%23%20Films/(2001)%20The%20Lord%20Of%20The%20Rings%20-%20The%20Fellowship%20Of%20The%20Ring/1%20-%20Howard%20Shore%20-%20The%20Prophecy.flac'
      )
      expect(electron.shell.showItemInFolder).toHaveBeenCalledTimes(1)
    })

    it('handles unknown model', async () => {
      models.tracksModel.getById.mockResolvedValueOnce(null)
      const id = faker.random.number()

      await tracksService.openContainingFolder(id)
      expect(models.tracksModel.getById).toHaveBeenCalledWith(id)
      expect(models.tracksModel.getById).toHaveBeenCalledTimes(1)
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
    })
  })
})
