'use strict'

const faker = require('faker')
const os = require('os')
const fs = require('fs-extra')
const { join } = require('path')
const { EventEmitter } = require('events')
const {
  utils: { getLogger }
} = require('@melodie/core')
const electron = require('electron')
const { sleep } = require('../tests')
const {
  manageState,
  unmanageState,
  focusOnNotification
} = require('./window-state')

function makeWin(id = faker.datatype.number()) {
  const win = new EventEmitter()
  Object.assign(win, {
    id,
    getBounds: jest.fn().mockReturnValue({
      x: faker.datatype.number(),
      y: faker.datatype.number(),
      width: faker.datatype.number(),
      height: faker.datatype.number()
    }),
    setBounds: jest.fn(),
    isDestroyed: jest.fn().mockReturnValue(false),
    isMaximized: jest.fn().mockReturnValue(faker.datatype.boolean()),
    isMinimized: jest.fn().mockReturnValue(faker.datatype.boolean()),
    isFullScreen: jest.fn().mockReturnValue(faker.datatype.boolean()),
    maximize: jest.fn(),
    minimize: jest.fn(),
    restore: jest.fn(),
    focus: jest.fn(),
    setFullScreen: jest.fn()
  })
  return win
}

const tmpdir = os.tmpdir()

describe('window state management utilities', () => {
  let win
  let warn

  beforeEach(() => {
    jest.clearAllMocks()
    electron.app.getPath.mockReturnValue(tmpdir)
    warn = jest.spyOn(getLogger('utils/window-state'), 'warn')
  })

  afterEach(() => win && unmanageState(win))

  it('does not complain when state file does not exist', async () => {
    win = makeWin()
    expect(() => manageState(win)).not.toThrow()
    expect(win.setBounds).not.toHaveBeenCalled()
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
    expect(win.setFullScreen).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('reports unparseable state file', async () => {
    win = makeWin()

    await fs.writeFile(join(tmpdir, `state-${win.id}.json`), 'unparseable')

    expect(() => manageState(win)).not.toThrow()

    await sleep(100)

    expect(win.setBounds).not.toHaveBeenCalled()
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
    expect(win.setFullScreen).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(
      expect.any(Object),
      `failed to parse previous state: Unexpected token u in JSON at position 0`
    )
  })

  it('reports saving errors', async () => {
    win = makeWin()
    const file = join(tmpdir, `state-${win.id}.json`)

    manageState(win)

    await fs.writeFile(file, '')
    await fs.chmod(file, 0o444)

    win.emit('move')
    await sleep(300)

    expect(warn).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('failed to save state') // linux throws EACCESS, windows EPERM
    )
  })

  it('does not unmanaged unknown window', async () => {
    win = makeWin()
    expect(() => unmanageState(win)).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('restores previously saved state', async () => {
    win = makeWin()
    const state = {
      ...win.getBounds(),
      isMaximized: true,
      isMinimized: false,
      isFullScreen: false
    }
    await fs.writeFile(
      join(tmpdir, `state-${win.id}.json`),
      JSON.stringify(state)
    )

    manageState(win)
    expect(win.setBounds).toHaveBeenCalledWith(state)
    expect(win.maximize).toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
    expect(win.setFullScreen).not.toHaveBeenCalled()
  })

  it('restores full screen', async () => {
    win = makeWin()
    const state = {
      ...win.getBounds(),
      isMaximized: false,
      isMinimized: false,
      isFullScreen: true
    }
    await fs.writeFile(
      join(tmpdir, `state-${win.id}.json`),
      JSON.stringify(state)
    )

    manageState(win)
    expect(win.setBounds).toHaveBeenCalledWith(state)
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
    expect(win.setFullScreen).toHaveBeenCalledWith(true)
  })

  it('restores minimized', async () => {
    win = makeWin()
    const state = {
      ...win.getBounds(),
      isMaximized: false,
      isMinimized: true,
      isFullScreen: false
    }
    await fs.writeFile(
      join(tmpdir, `state-${win.id}.json`),
      JSON.stringify(state)
    )

    manageState(win)
    expect(win.setBounds).toHaveBeenCalledWith(state)
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).toHaveBeenCalled()
    expect(win.setFullScreen).not.toHaveBeenCalled()
  })

  it.each(['resize', 'move', 'minimize', 'restore', 'maximize', 'unmaximize'])(
    'saves state on %s',
    async event => {
      win = makeWin()
      let bounds = win.getBounds()
      let isMaximized = win.isMaximized()
      let isMinimized = win.isMinimized()
      let isFullScreen = win.isFullScreen()
      manageState(win)
      win.emit(event)
      await sleep(300)

      expect(win.setBounds).not.toHaveBeenCalled()
      expect(win.maximize).not.toHaveBeenCalled()
      expect(win.minimize).not.toHaveBeenCalled()
      expect(win.setFullScreen).not.toHaveBeenCalled()

      expect(win.getBounds).toHaveBeenCalled()
      expect(win.isMaximized).toHaveBeenCalled()
      expect(win.isMinimized).toHaveBeenCalled()
      expect(win.isFullScreen).toHaveBeenCalled()

      expect(
        JSON.parse(
          await fs.readFile(join(tmpdir, `state-${win.id}.json`), 'utf8')
        )
      ).toEqual({
        ...bounds,
        isMaximized,
        isMinimized,
        isFullScreen
      })
    }
  )

  it('only care about last event', async () => {
    win = makeWin()
    const bounds = {
      x: faker.datatype.number(),
      y: faker.datatype.number(),
      width: faker.datatype.number(),
      height: faker.datatype.number()
    }
    win.getBounds.mockReturnValueOnce(bounds)
    win.isMinimized.mockReturnValueOnce(true)
    win.isMaximized.mockReturnValueOnce(false)
    win.isFullScreen.mockReturnValueOnce(false)

    manageState(win)

    win.emit('move')
    win.emit('maximize')
    win.emit('move')
    win.emit('minimize')

    await sleep(300)

    expect(
      JSON.parse(
        await fs.readFile(join(tmpdir, `state-${win.id}.json`), 'utf8')
      )
    ).toEqual({
      ...bounds,
      isMaximized: false,
      isMinimized: true,
      isFullScreen: false
    })
  })

  it('focuses window on notification click', () => {
    win = makeWin()
    win.isMinimized.mockReturnValueOnce(false)

    focusOnNotification(win)
    expect(win.focus).toHaveBeenCalledTimes(1)
    expect(win.restore).not.toHaveBeenCalled()
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
  })

  it('restored minimized window and focuses it on notification click', () => {
    win = makeWin()
    win.isMinimized.mockReturnValueOnce(true)

    focusOnNotification(win)
    expect(win.focus).toHaveBeenCalledTimes(1)
    expect(win.restore).toHaveBeenCalledTimes(1)
    expect(win.focus).toHaveBeenCalledAfter(win.restore)
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
  })
})
