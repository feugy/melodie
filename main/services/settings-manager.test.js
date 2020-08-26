'use strict'

const { join } = require('path')
const faker = require('faker')
const electron = require('electron')
const osLocale = require('os-locale')
const engine = require('./settings-manager')
const fileLoader = require('./file-loader')
const { settingsModel } = require('../models/settings')

jest.mock('os-locale')
jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  }
}))
jest.mock('./file-loader')
jest.mock('../models/settings')

describe('Settings manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    settingsModel.get.mockResolvedValue({})
  })

  it('returns folders from settings', async () => {
    const folders = [faker.system.fileName(), faker.system.fileName()]
    settingsModel.get.mockResolvedValueOnce({ folders })

    expect(await engine.getFolders()).toEqual(folders)
  })

  it('returns system locale when locale not set', async () => {
    settingsModel.get.mockResolvedValueOnce({})
    osLocale.mockResolvedValueOnce('fr-FR')

    expect(await engine.getLocale()).toEqual('fr')
  })

  it('returns previously set locale', async () => {
    const locale = faker.random.word()
    settingsModel.get.mockResolvedValueOnce({ locale })
    osLocale.mockResolvedValueOnce('fr-FR')

    expect(await engine.getLocale()).toEqual(locale)
    expect(osLocale).not.toHaveBeenCalled()
  })

  it('can set locale', async () => {
    const locale = faker.random.word()
    const folders = [faker.system.fileName(), faker.system.fileName()]
    settingsModel.get.mockResolvedValueOnce({ folders })

    await engine.setLocale(locale)

    expect(settingsModel.save).toHaveBeenCalledWith({ folders, locale })
  })

  describe('addFolders', () => {
    it('saves selected folders to settings', async () => {
      const folders = [faker.system.fileName()]
      settingsModel.get.mockResolvedValueOnce({ folders })
      const filePaths = [faker.system.fileName(), faker.system.fileName()]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })

      expect(await engine.addFolders())

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(settingsModel.save).toHaveBeenCalledWith({
        id: settingsModel.ID,
        folders: folders.concat(filePaths)
      })
      expect(settingsModel.save).toHaveBeenCalledTimes(1)
      expect(fileLoader.walkAndWatch).toHaveBeenCalledWith(
        folders.concat(filePaths)
      )
      expect(fileLoader.walkAndWatch).toHaveBeenCalledTimes(1)
      expect(fileLoader.unwatch).toHaveBeenCalledWith(folders)
      expect(fileLoader.unwatch).toHaveBeenCalledTimes(1)
      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
        properties: ['openDirectory', 'multiSelections']
      })
    })

    it('does not saves empty selection', async () => {
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths: [] })

      expect(await engine.addFolders())

      expect(settingsModel.get).not.toHaveBeenCalled()
      expect(settingsModel.save).not.toHaveBeenCalled()
      expect(fileLoader.walkAndWatch).not.toHaveBeenCalled()
      expect(fileLoader.unwatch).not.toHaveBeenCalled()
    })

    it('merges nested added folder into its tracked parent', async () => {
      const parent1 = join(faker.lorem.word(), faker.lorem.word())
      const parent2 = join(faker.lorem.word(), faker.lorem.word())
      const folders = [parent1, faker.system.fileName(), parent2]
      settingsModel.get.mockResolvedValueOnce({ folders })
      const filePaths = [
        join(parent1, faker.system.fileName()),
        join(parent2, faker.system.fileName()),
        faker.system.fileName()
      ]
      electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })

      expect(await engine.addFolders())

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(settingsModel.save).toHaveBeenCalledWith({
        id: settingsModel.ID,
        folders: folders.concat(filePaths.slice(2))
      })
      expect(settingsModel.save).toHaveBeenCalledTimes(1)
      expect(fileLoader.walkAndWatch).toHaveBeenCalledWith(
        folders.concat(filePaths.slice(2))
      )
      expect(fileLoader.walkAndWatch).toHaveBeenCalledTimes(1)
      expect(fileLoader.unwatch).toHaveBeenCalledWith(folders)
      expect(fileLoader.unwatch).toHaveBeenCalledTimes(1)
    })

    it('removes nested folders when adding a common parent', async () => {
      const parent = join(faker.lorem.word(), faker.lorem.word())
      const folders = [
        join(parent, faker.system.fileName()),
        faker.system.fileName(),
        join(parent, faker.system.fileName())
      ]
      settingsModel.get.mockResolvedValueOnce({ folders })
      electron.dialog.showOpenDialog.mockResolvedValueOnce({
        filePaths: [parent]
      })

      expect(await engine.addFolders())

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(settingsModel.save).toHaveBeenCalledWith({
        id: settingsModel.ID,
        folders: [folders[1], parent]
      })
      expect(settingsModel.save).toHaveBeenCalledTimes(1)
      expect(fileLoader.walkAndWatch).toHaveBeenCalledWith([folders[1], parent])
      expect(fileLoader.walkAndWatch).toHaveBeenCalledTimes(1)
      expect(fileLoader.unwatch).toHaveBeenCalledWith(folders)
      expect(fileLoader.unwatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('removeFolder', () => {
    it('removes tracked folder from settings', async () => {
      const folders = [
        faker.system.fileName(),
        faker.system.fileName(),
        faker.system.fileName()
      ]
      settingsModel.get.mockResolvedValueOnce({ folders: [...folders] })

      expect(await engine.removeFolder(folders[1]))

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(settingsModel.save).toHaveBeenCalledWith({
        id: settingsModel.ID,
        folders: [folders[0], folders[2]]
      })
      expect(settingsModel.save).toHaveBeenCalledTimes(1)
      expect(fileLoader.unwatch).toHaveBeenCalledWith(folders[1])
      expect(fileLoader.unwatch).toHaveBeenCalledTimes(1)
    })

    it('ignores untracked folder', async () => {
      const folders = [faker.system.fileName(), faker.system.fileName()]
      settingsModel.get.mockResolvedValueOnce({ folders })

      expect(await engine.removeFolder(faker.system.fileName()))

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(settingsModel.save).not.toHaveBeenCalled()
      expect(fileLoader.unwatch).not.toHaveBeenCalled()
    })
  })

  describe('compareAndWatch', () => {
    it('gets tracked folders, compares and watches them', async () => {
      const folders = [
        faker.system.fileName(),
        faker.system.fileName(),
        faker.system.fileName()
      ]
      settingsModel.get.mockResolvedValueOnce({ folders })

      expect(await engine.compareAndWatch())

      expect(settingsModel.get).toHaveBeenCalledTimes(1)
      expect(fileLoader.compare).toHaveBeenCalledWith(folders)
      expect(fileLoader.watch).toHaveBeenCalledWith(folders)
    })
  })
})
