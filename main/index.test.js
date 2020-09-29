'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const electron = require('electron')
const { autoUpdater } = require('electron-updater')
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
    await main()

    expect(models.init).toHaveBeenCalledWith('db.sqlite3')
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(services.settings.init).toHaveBeenCalledTimes(1)
    expect(services.tracks.listen).toHaveBeenCalledTimes(1)
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${resolve(__dirname, '..', 'public')}/index.html`
    )
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(configureExternalLinks).toHaveBeenCalledWith(win)
    expect(configureExternalLinks).toHaveBeenCalledTimes(1)
    expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1)
  })

  it('quits when closing window', async () => {
    await main()
    electron.app.emit('window-all-closed')

    expect(electron.app.quit).toHaveBeenCalledTimes(1)
  })
})
