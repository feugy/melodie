'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const electron = require('electron')
const { main } = require('.')
const models = require('./models')
const services = require('./services')

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
  return {
    app,
    ipcMain,
    Menu: {
      setApplicationMenu: jest.fn()
    },
    BrowserWindow: jest.fn()
  }
})
jest.mock('./services')
jest.mock('./models')
jest.mock('electron-reload')

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

  it('initialize models and loads renderer', async () => {
    await main()

    expect(models.init).toHaveBeenCalledWith('db.sqlite3')
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(services.settingsManager.recordOpening).toHaveBeenCalledWith()
    expect(services.settingsManager.recordOpening).toHaveBeenCalledTimes(1)
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${resolve(__dirname, '..', 'public')}/index.html`
    )
    expect(electron.app.quit).not.toHaveBeenCalled()
  })

  it('quits when closing window', async () => {
    await main()
    electron.app.emit('window-all-closed')

    expect(electron.app.quit).toHaveBeenCalledTimes(1)
  })
})
