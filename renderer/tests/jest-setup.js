'use strict'

import '../common'

export const mockOn = jest.fn()
export const mockRemoveListener = jest.fn()
export const mockInvoke = jest.fn()

jest.mock('electron', () => ({
  ipcRenderer: {
    on: mockOn,
    removeListener: mockRemoveListener,
    invoke: mockInvoke
  }
}))
