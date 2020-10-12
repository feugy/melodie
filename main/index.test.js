'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const electron = require('electron')
const { autoUpdater } = require('electron-updater')
const faker = require('faker')
const { main } = require('.')
const models = require('./models')
const services = require('./services')
const { configureExternalLinks } = require('./utils')

jest.mock('electron', () => {
  const { EventEmitter } = require('events')
  const app = new EventEmitter()
  app.whenReady = jest.fn().mockResolvedValue()
  app.getPath = jest.fn().mockReturnValue('')
  app.getAppPath = jest.fn()
  app.quit = jest.fn()
  app.isPackaged = true
  const ipcMain = new EventEmitter()
  ipcMain.handle = jest.fn()
  ipcMain.removeHandler = jest.fn()
  const webContents = new EventEmitter()
  return {
    app,
    ipcMain,
    Menu: {
      setApplicationMenu: jest.fn()
    },
    BrowserWindow: jest.fn().mockResolvedValue({ webContents })
  }
})
jest.mock('electron-updater', () => {
  const autoUpdater = new (require('events').EventEmitter)()
  autoUpdater.checkForUpdatesAndNotify = jest.fn()
  return { autoUpdater }
})
jest.mock('electron-reload')
jest.mock('./services')
jest.mock('./models')
jest.mock('./utils/links')

describe('Application test', () => {
  let win

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    win = new EventEmitter()
    win.loadURL = jest.fn()
    electron.BrowserWindow.mockReturnValue(win)
    electron.app.removeAllListeners()
  })

  it('initialize models, tracks service and loads renderer', async () => {
    await main(['asar-location'])

    expect(models.init).toHaveBeenCalledWith('db.sqlite3')
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(services.settings.init).toHaveBeenCalledTimes(1)
    expect(services.tracks.listen).toHaveBeenCalledTimes(1)
    expect(services.tracks.play).toHaveBeenCalledWith([])
    expect(services.tracks.play).toHaveBeenCalledTimes(1)
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${resolve(__dirname, '..', 'public')}/index.html`
    )
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(configureExternalLinks).toHaveBeenCalledWith(win)
    expect(configureExternalLinks).toHaveBeenCalledTimes(1)
    expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1)
  })

  it('quits when closing window', async () => {
    await main(['asar-location'])
    electron.app.emit('window-all-closed')

    expect(electron.app.quit).toHaveBeenCalledTimes(1)
  })

  describe('given some parameters from CLI', () => {
    const file1 = faker.system.filePath()
    const file2 = faker.system.filePath()

    it('tries to plays them when packed', async () => {
      electron.app.isPackaged = true
      await main(['asar-location', file1, file2])
      expect(services.tracks.play).toHaveBeenCalledWith([file1, file2])
      expect(services.tracks.play).toHaveBeenCalledTimes(1)
    })

    it('tries to plays them when unpacked', async () => {
      electron.app.isPackaged = false
      await main(['electron', '.', file1, file2])
      expect(services.tracks.play).toHaveBeenCalledWith([file1, file2])
      expect(services.tracks.play).toHaveBeenCalledTimes(1)
    })
  })
})
