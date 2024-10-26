// import { autoUpdater } from 'electron-updater'
import { faker } from '@faker-js/faker'
import { utils } from '@melodie/core'
import { app, BrowserWindow, dialog } from 'electron'
import { EventEmitter } from 'events'
import os from 'os'
import * as OTPAuth from 'otpauth'
import { join, resolve } from 'path'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import * as services from './lib/services'
import { sleep } from './lib/tests'
import { configureExternalLinks } from './lib/utils'
import descriptor from './package.json' assert { type: 'json' }

const publicFolder = resolve(__dirname, 'out')

let platformSpy = vi.spyOn(os, 'platform')

vi.mock('electron', async importActual => {
  const { EventEmitter } = await import('events')
  const app = new EventEmitter()
  app.instanceCount = 0
  app.whenReady = vi.fn().mockResolvedValue()
  app.getPath = vi.fn().mockReturnValue('')
  app.getAppPath = vi.fn().mockReturnValue('')
  app.quit = vi.fn().mockImplementation(() => {
    app.instanceCount = Math.max(app.instanceCount - 1, 0)
  })
  app.isPackaged = true
  app.requestSingleInstanceLock = vi.fn().mockImplementation(() => {
    app.instanceCount++
    if (app.instanceCount > 1) {
      app.emit('second-instance')
    }
    return app.instanceCount === 1
  })
  const ipcMain = new EventEmitter()
  ipcMain.handle = vi.fn()
  ipcMain.removeHandler = vi.fn()
  return {
    ...(await importActual()),
    app,
    ipcMain,
    dialog: {
      showErrorBox: vi.fn()
    },
    Menu: {
      setApplicationMenu: vi.fn()
    },
    globalShortcut: { register: vi.fn() },
    BrowserWindow: vi.fn()
  }
})
// vi.mock('electron-updater', () => {
//   const autoUpdater = new (require('events').EventEmitter)()
//   autoUpdater.checkForUpdatesAndNotify = vi.fn()
//   return { autoUpdater }
// })
// vi.mock('electron-reload')
vi.mock('@melodie/core')
vi.mock('./lib/services')
vi.mock('./lib/utils/links')

describe('Application test', () => {
  let win
  let main
  const port = faker.number.int({ min: 1024, max: 20000 })
  const totpSecret = Buffer.from(faker.string.uuid())
    .toString('hex')
    .toUpperCase()

  beforeAll(async () => {
    // defer so we could mock electron
    ;({ main } = await import('./main'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    win = new EventEmitter()
    win.loadURL = vi.fn()
    win.focus = vi.fn()
    win.isMinimized = vi.fn()
    win.restore = vi.fn()
    BrowserWindow.mockReturnValue(win)
    app.removeAllListeners()
    process.env.NODE_ENV = ''
    utils.getLogger.mockReturnValue({
      info() {},
      debug() {},
      warn() {},
      error() {}
    })
    services.start.mockImplementation(
      async (folder, win, desc, desiredPort) => ({
        port: desiredPort || port,
        close: vi.fn(),
        totp: new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromHex(totpSecret) })
      })
    )
  })

  afterEach(() => {
    app.quit()
    process.env.NODE_ENV = 'test'
  })

  it('initialize models, tracks service and loads renderer', async () => {
    await main(['asar-location'])

    expect(services.start).toHaveBeenCalledWith(
      publicFolder,
      expect.any(Object),
      descriptor,
      undefined
    )
    expect(services.start).toHaveBeenCalledOnce()
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${join(
        publicFolder,
        'index.html'
      )}?port=${port}&totpSecret=${totpSecret}`
    )
    expect(app.quit).not.toHaveBeenCalled()
    expect(dialog.showErrorBox).not.toHaveBeenCalled()
    expect(configureExternalLinks).toHaveBeenCalledWith(win)
    expect(configureExternalLinks).toHaveBeenCalledOnce()
    // expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalledOnce()

    await sleep(300)
    expect(services.playFiles).not.toHaveBeenCalled()
  })

  it.each([
    [['asar-location', '--port', 8080], { desiredPort: 8080, entries: [] }],
    [['.', '-p', 9090], { desiredPort: 9090, entries: [] }],
    [['.', '-p=7070'], { desiredPort: 7070, entries: [] }],
    [['asar-location', '--port=6060'], { desiredPort: 6060, entries: [] }],
    [['asar-location', 'file1', 'file 2'], { entries: ['file1', 'file 2'] }],
    [
      ['.', '-p', 5050, 'file1', 'file 2'],
      { desiredPort: 5050, entries: ['file1', 'file 2'] }
    ],
    [
      ['.', 'file1', 'file 2', '--port=4040'],
      { desiredPort: 4040, entries: ['file1', 'file 2'] }
    ],
    [['.', 'file1', 'file 2', '--port'], { entries: ['file1', 'file 2'] }],
    [['.', '-p='], { entries: [] }]
  ])('parse %j CLI arguments', async (argv, { desiredPort, entries }) => {
    await main(argv)

    expect(services.start).toHaveBeenCalledWith(
      publicFolder,
      expect.any(Object),
      descriptor,
      desiredPort
    )
    expect(services.start).toHaveBeenCalledOnce()
    expect(win.loadURL).toHaveBeenCalledWith(
      `file://${join(publicFolder, 'index.html')}?port=${
        desiredPort || port
      }&totpSecret=${totpSecret}`
    )

    await sleep(300)
    if (entries.length) {
      expect(services.playFiles).toHaveBeenCalledWith(entries)
      expect(services.playFiles).toHaveBeenCalledOnce()
    } else {
      expect(services.playFiles).not.toHaveBeenCalled()
    }
  })

  it('quits when closing window', async () => {
    await main(['asar-location'])
    app.emit('window-all-closed')

    expect(app.quit).toHaveBeenCalledOnce()
  })

  it('enforces single instance and focus existing one', async () => {
    await main(['asar-location'])
    expect(app.quit).not.toHaveBeenCalled()
    expect(services.start).toHaveBeenCalledOnce()
    expect(win.isMinimized).not.toHaveBeenCalled()
    expect(win.focus).not.toHaveBeenCalled()

    await main(['asar-location'])
    expect(app.quit).toHaveBeenCalledOnce()
    expect(services.start).toHaveBeenCalledOnce()
    expect(win.isMinimized).toHaveBeenCalledOnce()
    expect(win.focus).toHaveBeenCalledOnce()
  })

  it('restore minimized instance when opening another instance', async () => {
    win.isMinimized.mockReturnValue(true)

    await main(['asar-location'])
    expect(app.quit).not.toHaveBeenCalled()
    expect(services.start).toHaveBeenCalledOnce()
    expect(win.isMinimized).not.toHaveBeenCalled()
    expect(win.focus).not.toHaveBeenCalled()

    await main(['asar-location'])
    expect(app.quit).toHaveBeenCalledOnce()
    expect(services.start).toHaveBeenCalledOnce()
    expect(win.isMinimized).toHaveBeenCalledOnce()
    expect(win.restore).toHaveBeenCalledOnce()
    expect(win.focus).toHaveBeenCalledAfter(win.restore)

    app.emit('window-all-closed')
    expect(app.quit).toHaveBeenCalledTimes(2)
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
        app.isPackaged = true
        await main(['asar-location', ...files])

        await sleep(300)
        expect(services.playFiles).toHaveBeenCalledWith(files)
        expect(services.playFiles).toHaveBeenCalledOnce()
      })

      it('plays them when unpacked', async () => {
        app.isPackaged = false
        await main(['electron', '.', ...files])

        await sleep(300)
        expect(services.playFiles).toHaveBeenCalledWith(files)
        expect(services.playFiles).toHaveBeenCalledOnce()
      })
    })

    describe('given an OSX machine', () => {
      beforeAll(() => {
        platformSpy.mockImplementation(() => 'darwin')
      })

      it('plays them', async () => {
        const promise = main(['asar-location'])
        for (const file of files) {
          app.emit('open-file', {}, file)
        }
        await promise

        await sleep(300)
        expect(services.playFiles).toHaveBeenCalledWith(files)
        expect(services.playFiles).toHaveBeenCalledOnce()
      })
    })
  })
})
