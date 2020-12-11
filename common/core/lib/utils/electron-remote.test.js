'use strict'

const electron = require('electron')
const faker = require('faker')
const {
  subscribeRemote,
  registerRenderer,
  broadcast,
  unregisterRenderer
} = require('./electron-remote')
const { getLogger } = require('./logger')

jest.mock('electron', () => {
  const { EventEmitter } = require('events')
  const app = new EventEmitter()
  app.getPath = jest.fn().mockReturnValue('')
  const ipcMain = new EventEmitter()
  ipcMain.handle = jest.fn()
  ipcMain.removeHandler = jest.fn()
  return { app, ipcMain }
})
jest.mock('./logger', () => {
  const logger = {
    error: jest.fn()
  }
  return { getLogger: () => logger }
})

describe('electron-remote', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    electron.ipcMain.removeAllListeners()
  })

  it('subscribes and unsubscribes a channel handler', () => {
    const unsubscribe = subscribeRemote()
    expect(unsubscribe).toBeInstanceOf(Function)

    expect(electron.ipcMain.handle).toHaveBeenCalledWith(
      'remote',
      expect.any(Function)
    )
    expect(electron.ipcMain.removeHandler).not.toHaveBeenCalled()

    unsubscribe()
    expect(electron.ipcMain.removeHandler).toHaveBeenCalledWith('remote')
    expect(electron.ipcMain.removeHandler).toHaveBeenCalledTimes(1)
    expect(electron.ipcMain.handle).toHaveBeenCalledTimes(1)
    expect(getLogger().error).not.toHaveBeenCalled()
  })

  it('throws error on unknown module', done => {
    electron.ipcMain.handle.mockImplementation(async (channel, handler) => {
      const module = faker.random.word()
      const fn = faker.random.word()
      await handler({}, module, fn, 1, 2)

      expect(getLogger().error).toHaveBeenCalledWith(
        { module, fn },
        `electron doesn't support ${module}.${fn}()`
      )
      expect(getLogger().error).toHaveBeenCalledTimes(1)

      setTimeout(() => {
        unsubscribe()
        done()
      }, 0)
    })
    const unsubscribe = subscribeRemote()
  })

  it('throws error on unknown function', done => {
    electron.dialog = {
      showOpenDialog: jest.fn()
    }
    electron.ipcMain.handle.mockImplementation(async (channel, handler) => {
      const module = 'dialog'
      const fn = faker.random.word()
      await handler({}, module, fn, 1, 2)
      expect(getLogger().error).toHaveBeenCalledWith(
        { module, fn },
        `electron doesn't support ${module}.${fn}()`
      )
      expect(getLogger().error).toHaveBeenCalledTimes(1)

      setTimeout(() => {
        unsubscribe()
        done()
      }, 0)
    })
    const unsubscribe = subscribeRemote()
  })

  it('logs error', done => {
    const error = new Error('for testing!')
    electron.dialog = {
      showOpenDialog: jest.fn().mockRejectedValue(error)
    }
    electron.ipcMain.handle.mockImplementation(async (channel, handler) => {
      const module = 'dialog'
      const fn = 'showOpenDialog'
      expect(await handler({}, module, fn)).toBeUndefined()
      expect(getLogger().error).toHaveBeenCalledWith(
        error,
        `Error while running ${module}.${fn}()`
      )
      expect(getLogger().error).toHaveBeenCalledTimes(1)

      setTimeout(() => {
        unsubscribe()
        done()
      }, 0)
    })
    const unsubscribe = subscribeRemote()
  })

  it('logs UI error', () => {
    const error = new Error('for testing!')
    const unsubscribe = subscribeRemote()
    electron.ipcMain.emit('error', null, error)

    expect(getLogger().error).toHaveBeenCalledWith(error, 'UI error')
    expect(getLogger().error).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('invokes relevant module', done => {
    const result = faker.random.word()
    const arg1 = {
      lorem: faker.lorem.word()
    }
    const arg2 = faker.random.number()
    electron.dialog = {
      showOpenDialog: jest.fn().mockResolvedValueOnce(result)
    }
    electron.ipcMain.handle.mockImplementation(async (channel, handler) => {
      await expect(
        handler({}, 'dialog', 'showOpenDialog', arg1, arg2)
      ).resolves.toEqual(result)
      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith(arg1, arg2)
      expect(electron.dialog.showOpenDialog).toHaveBeenCalledTimes(1)
      expect(electron.ipcMain.removeHandler).not.toHaveBeenCalled()

      setTimeout(() => {
        unsubscribe()
        done()
      }, 0)
    })
    const unsubscribe = subscribeRemote()
  })

  it('registers renderer and broadcast messages', () => {
    const renderers = [
      {
        webContents: { send: jest.fn() }
      },
      {
        webContents: { send: jest.fn() }
      },
      {
        webContents: { send: jest.fn() }
      }
    ]

    for (const renderer of renderers) {
      registerRenderer(renderer)
    }

    const message = faker.lorem.word()
    broadcast(message)

    expect(renderers[0].webContents.send).toHaveBeenCalledWith(message)
    expect(renderers[0].webContents.send).toHaveBeenCalledTimes(1)
    expect(renderers[1].webContents.send).toHaveBeenCalledWith(message)
    expect(renderers[1].webContents.send).toHaveBeenCalledTimes(1)
    expect(renderers[2].webContents.send).toHaveBeenCalledWith(message)
    expect(renderers[2].webContents.send).toHaveBeenCalledTimes(1)

    jest.resetAllMocks()
    unregisterRenderer(renderers[1])

    const message2 = faker.lorem.word()
    broadcast(message2)

    expect(renderers[0].webContents.send).toHaveBeenCalledWith(message2)
    expect(renderers[0].webContents.send).toHaveBeenCalledTimes(1)
    expect(renderers[1].webContents.send).not.toHaveBeenCalled()
    expect(renderers[2].webContents.send).toHaveBeenCalledWith(message2)
    expect(renderers[2].webContents.send).toHaveBeenCalledTimes(1)
  })

  it('does not registers same renderer twice', () => {
    const renderer = {
      webContents: { send: jest.fn() }
    }

    registerRenderer(renderer)
    registerRenderer(renderer)

    const message = faker.lorem.word()
    broadcast(message)

    expect(renderer.webContents.send).toHaveBeenCalledWith(message)
    expect(renderer.webContents.send).toHaveBeenCalledTimes(1)

    unregisterRenderer(renderer)
    unregisterRenderer(renderer)

    broadcast(faker.lorem.word())
    expect(renderer.webContents.send).toHaveBeenCalledTimes(1)
  })
})
