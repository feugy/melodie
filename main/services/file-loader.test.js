'use strict'

const faker = require('faker')
const engine = require('./file-loader')
const trackEngine = require('./search-engine')
const listEngine = require('./list-engine')
const electron = require('electron')
const mockOs = require('os')

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn()
  },
  app: {
    getAppPath: jest.fn()
  }
}))
jest.mock('./list-engine')
jest.mock('./search-engine')

describe.skip('File loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    electron.app.getAppPath.mockReturnValue(mockOs.tmpdir())
  })

  it('loads files selected from dialog', async () => {
    const filePaths = [faker.system.fileName(), faker.system.fileName()]
    electron.dialog.showOpenDialog.mockResolvedValueOnce({ filePaths })

    const tracks = await engine.load()
    expect(tracks).toHaveLength(filePaths.length)
    expect(trackEngine.add).toHaveBeenCalledWith(tracks)
    expect(trackEngine.add).toHaveBeenCalledTimes(1)
    expect(listEngine.add).toHaveBeenCalledWith(tracks)
    expect(listEngine.add).toHaveBeenCalledTimes(1)
    expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
      properties: ['openDirectory', 'multiSelections']
    })
    expect(electron.dialog.showOpenDialog).toHaveBeenCalledTimes(1)
  })

  it('handles no selection', async () => {
    electron.dialog.showOpenDialog.mockResolvedValueOnce({})
    let tracks = await engine.load()
    expect(tracks).toBe(null)

    electron.dialog.showOpenDialog.mockResolvedValueOnce({})
    tracks = await engine.load()
    expect(tracks).toBe(null)

    expect(trackEngine.add).not.toHaveBeenCalled()
    expect(listEngine.add).not.toHaveBeenCalled()
  })
})
