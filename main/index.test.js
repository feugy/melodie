'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')
const os = require('os')
const electron = require('electron')
const { autoUpdater } = require('electron-updater')
const faker = require('faker')
const models = require('./models')
const services = require('./services')
const { configureExternalLinks } = require('./utils')
const { sleep } = require('./tests')

let platformSpy = jest.spyOn(os, 'platform')
const { main } = require('.')
const { app } = require('electron')

jest.mock('electron', () => {
  let instanceCount = 0
  const { EventEmitter } = require('events')
  const app = new EventEmitter()
  app.whenReady = jest.fn().mockResolvedValue()
  app.getPath = jest.fn().mockReturnValue('')
  app.getAppPath = jest.fn()
  app.quit = jest.fn().mockImplementation(() => {
    instanceCount--
  })
  app.isPackaged = true
  app.requestSingleInstanceLock = jest.fn().mockImplementation(() => {
    instanceCount++
    if (instanceCount > 1) {
      app.emit('second-instance')
    }
    return instanceCount === 1
  })
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
    jest.clearAllMocks()
    win = new EventEmitter()
    win.loadURL = jest.fn()
    win.focus = jest.fn()
    win.isMinimized = jest.fn()
    win.restore = jest.fn()
    electron.BrowserWindow.mockReturnValue(win)
    electron.app.removeAllListeners()
  })

  afterEach(() => {
    app.emit('window-all-closed')
  })

  it('initialize models, tracks service and loads renderer', async () => {
    await main(['asar-location'])

    expect(models.init).toHaveBeenCalledWith('db.sqlite3')
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(services.settings.init).toHaveBeenCalledTimes(1)
    expect(services.tracks.listen).toHaveBeenCalledTimes(1)
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${resolve(__dirname, '..', 'public', 'index.html')}`
    )
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(configureExternalLinks).toHaveBeenCalledWith(win)
    expect(configureExternalLinks).toHaveBeenCalledTimes(1)
    expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1)

    await sleep(300)
    expect(services.tracks.play).not.toHaveBeenCalled()
  })

  it('quits when closing window', async () => {
    await main(['asar-location'])
    electron.app.emit('window-all-closed')

    expect(electron.app.quit).toHaveBeenCalledTimes(1)
  })

  it('enforces single instance and focus existing one', async () => {
    await main(['asar-location'])
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(models.init).toHaveBeenCalledWith('db.sqlite3')
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).not.toHaveBeenCalled()
    expect(win.focus).not.toHaveBeenCalled()

    await main(['asar-location'])
    expect(electron.app.quit).toHaveBeenCalledTimes(1)
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledTimes(1)

    electron.app.emit('window-all-closed')
    expect(electron.app.quit).toHaveBeenCalledTimes(2)
  })

  it('restore minimized instance when opening another instance', async () => {
    win.isMinimized.mockReturnValue(true)

    await main(['asar-location'])
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(models.init).toHaveBeenCalledWith('db.sqlite3')
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).not.toHaveBeenCalled()
    expect(win.focus).not.toHaveBeenCalled()

    await main(['asar-location'])
    expect(electron.app.quit).toHaveBeenCalledTimes(1)
    expect(models.init).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).toHaveBeenCalledTimes(1)
    expect(win.restore).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledAfter(win.restore)

    electron.app.emit('window-all-closed')
    expect(electron.app.quit).toHaveBeenCalledTimes(2)
  })

  describe('given some files to open', () => {
    const files = []

    beforeEach(() => {
      files.splice(
        0,
        files.length,
        faker.system.filePath(),
        faker.system.filePath()
      )
    })

    describe('given a linux or windows machine', () => {
      beforeAll(() => {
        platformSpy.mockImplementation(() => 'linux')
      })

      it('plays them when packed', async () => {
        electron.app.isPackaged = true
        await main(['asar-location', ...files])

        await sleep(300)
        expect(services.tracks.play).toHaveBeenCalledWith(files)
        expect(services.tracks.play).toHaveBeenCalledTimes(1)
      })

      it('plays them when unpacked', async () => {
        electron.app.isPackaged = false
        await main(['electron', '.', ...files])

        await sleep(300)
        expect(services.tracks.play).toHaveBeenCalledWith(files)
        expect(services.tracks.play).toHaveBeenCalledTimes(1)
      })
    })

    describe('given an OSX machine', () => {
      beforeAll(() => {
        platformSpy.mockImplementation(() => 'darwin')
      })

      it('plays them', async () => {
        const promise = main(['asar-location', ...files])
        for (const file of files) {
          app.emit('open-file', {}, file)
        }
        await promise

        await sleep(300)
        expect(services.tracks.play).toHaveBeenCalledWith(files)
        expect(services.tracks.play).toHaveBeenCalledTimes(1)
      })
    })
  })
})
