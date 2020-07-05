'use strict'
const electron = require('electron')
const faker = require('faker')
const subscribeRemote = require('./electron-remote')

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn()
  }
}))

describe('electron-remote', () => {
  beforeEach(jest.clearAllMocks)

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
  })

  it('throws error on unknown module', done => {
    electron.ipcMain.handle.mockImplementation((channel, handler) => {
      const module = faker.random.word()
      const fn = faker.random.word()
      expect(handler({}, module, fn, 1, 2)).rejects.toThrow(
        `electron doesn't support ${module}.${fn}()`
      )
      done()
    })
    subscribeRemote()
  })

  it('throws error on unknown function', done => {
    electron.dialog = {
      showOpenDialog: jest.fn()
    }
    electron.ipcMain.handle.mockImplementation((channel, handler) => {
      const module = 'dialog'
      const fn = faker.random.word()
      expect(handler({}, module, fn, 1, 2)).rejects.toThrow(
        `electron doesn't support ${module}.${fn}()`
      )
      done()
    })
    subscribeRemote()
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
    electron.ipcMain.handle.mockImplementation((channel, handler) => {
      expect(
        handler({}, 'dialog', 'showOpenDialog', arg1, arg2)
      ).resolves.toEqual(result)
      expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith(arg1, arg2)
      expect(electron.dialog.showOpenDialog).toHaveBeenCalledTimes(1)
      done()
    })
    subscribeRemote()
  })
})
