import { faker } from '@faker-js/faker'
import { utils } from '@melodie/core'
import * as electron from 'electron'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import os from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../tests'
import { focusOnNotification, manageState, unmanageState } from './window-state'

function makeWin(id = faker.number.int()) {
  const win = new EventEmitter()
  Object.assign(win, {
    id,
    getBounds: vi.fn().mockReturnValue({
      x: faker.number.int(),
      y: faker.number.int(),
      width: faker.number.int(),
      height: faker.number.int()
    }),
    setBounds: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    isMaximized: vi.fn().mockReturnValue(faker.datatype.boolean()),
    isMinimized: vi.fn().mockReturnValue(faker.datatype.boolean()),
    isFullScreen: vi.fn().mockReturnValue(faker.datatype.boolean()),
    maximize: vi.fn(),
    minimize: vi.fn(),
    restore: vi.fn(),
    focus: vi.fn(),
    setFullScreen: vi.fn()
  })
  return win
}

const tmpdir = os.tmpdir()

describe('window state management utilities', () => {
  let win
  let warn

  beforeEach(() => {
    vi.clearAllMocks()
    electron.app.getPath.mockReturnValue(tmpdir)
    warn = vi.spyOn(utils.getLogger('utils/window-state'), 'warn')
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
      `failed to parse previous state: Unexpected token 'u', "unparseable" is not valid JSON`
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
      x: faker.number.int(),
      y: faker.number.int(),
      width: faker.number.int(),
      height: faker.number.int()
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
    expect(win.focus).toHaveBeenCalledOnce()
    expect(win.restore).not.toHaveBeenCalled()
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
  })

  it('restored minimized window and focuses it on notification click', () => {
    win = makeWin()
    win.isMinimized.mockReturnValueOnce(true)

    focusOnNotification(win)
    expect(win.focus).toHaveBeenCalledOnce()
    expect(win.restore).toHaveBeenCalledOnce()
    expect(win.focus).toHaveBeenCalledAfter(win.restore)
    expect(win.maximize).not.toHaveBeenCalled()
    expect(win.minimize).not.toHaveBeenCalled()
  })
})
