'use strict'

const { EventEmitter } = require('events')
const { dirname, join } = require('path')
const os = require('os')
const electron = require('electron')
const { autoUpdater } = require('electron-updater')
const faker = require('faker')
const {
  utils: { getLogger }
} = require('@melodie/core')
const { sleep } = require('./lib/tests')
const services = require('./lib/services')
const { configureExternalLinks } = require('./lib/utils')

let platformSpy = jest.spyOn(os, 'platform')

jest.mock('electron', () => {
  let instanceCount = 0
  const { EventEmitter } = require('events')
  const app = new EventEmitter()
  app.whenReady = jest.fn().mockResolvedValue()
  app.getPath = jest.fn().mockReturnValue('')
  app.getAppPath = jest.fn().mockReturnValue('')
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
jest.mock('@melodie/core')
jest.mock('./lib/services')
jest.mock('./lib/utils/links')

describe('Application test', () => {
  let win
  let main

  beforeAll(() => {
    // defer so we could mock electron
    main = require('./main').main
  })

  beforeEach(() => {
    jest.clearAllMocks()
    win = new EventEmitter()
    win.loadURL = jest.fn()
    win.focus = jest.fn()
    win.isMinimized = jest.fn()
    win.restore = jest.fn()
    electron.BrowserWindow.mockReturnValue(win)
    electron.app.removeAllListeners()
    process.env.NODE_ENV = ''
    getLogger.mockReturnValue({ info() {}, debug() {}, warn() {}, error() {} })
    services.start.mockReturnValue(jest.fn())
  })

  afterEach(() => {
    electron.app.emit('window-all-closed')
    process.env.NODE_ENV = 'test'
  })

  it('initialize models, tracks service and loads renderer', async () => {
    const port = 8080
    await main(['asar-location'])

    expect(services.start).toHaveBeenCalledTimes(1)
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${join(
        dirname(require.resolve('@melodie/ui')),
        'public',
        'index.html'
      )}?port=${port}`
    )
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(configureExternalLinks).toHaveBeenCalledWith(win)
    expect(configureExternalLinks).toHaveBeenCalledTimes(1)
    expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalledTimes(1)

    await sleep(300)
    expect(services.playFiles).not.toHaveBeenCalled()
  })

  it('quits when closing window', async () => {
    await main(['asar-location'])
    electron.app.emit('window-all-closed')

    expect(electron.app.quit).toHaveBeenCalledTimes(1)
  })

  it('enforces single instance and focus existing one', async () => {
    await main(['asar-location'])
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(services.start).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).not.toHaveBeenCalled()
    expect(win.focus).not.toHaveBeenCalled()

    await main(['asar-location'])
    expect(electron.app.quit).toHaveBeenCalledTimes(1)
    expect(services.start).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledTimes(1)

    electron.app.emit('window-all-closed')
    expect(electron.app.quit).toHaveBeenCalledTimes(2)
  })

  it('restore minimized instance when opening another instance', async () => {
    win.isMinimized.mockReturnValue(true)

    await main(['asar-location'])
    expect(electron.app.quit).not.toHaveBeenCalled()
    expect(services.start).toHaveBeenCalledTimes(1)
    expect(win.isMinimized).not.toHaveBeenCalled()
    expect(win.focus).not.toHaveBeenCalled()

    await main(['asar-location'])
    expect(electron.app.quit).toHaveBeenCalledTimes(1)
    expect(services.start).toHaveBeenCalledTimes(1)
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
        expect(services.playFiles).toHaveBeenCalledWith(files)
        expect(services.playFiles).toHaveBeenCalledTimes(1)
      })

      it('plays them when unpacked', async () => {
        electron.app.isPackaged = false
        await main(['electron', '.', ...files])

        await sleep(300)
        expect(services.playFiles).toHaveBeenCalledWith(files)
        expect(services.playFiles).toHaveBeenCalledTimes(1)
      })
    })

    describe('given an OSX machine', () => {
      beforeAll(() => {
        platformSpy.mockImplementation(() => 'darwin')
      })

      it('plays them', async () => {
        const promise = main(['asar-location'])
        for (const file of files) {
          electron.app.emit('open-file', {}, file)
        }
        await promise

        await sleep(300)
        expect(services.playFiles).toHaveBeenCalledWith(files)
        expect(services.playFiles).toHaveBeenCalledTimes(1)
      })
    })
  })
})
