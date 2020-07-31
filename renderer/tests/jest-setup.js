'use strict'

const EventEmitter = require('events')
import '../common'

export const mockInvoke = jest.fn()
export const mockIpcRenderer = new EventEmitter()
mockIpcRenderer.invoke = mockInvoke

jest.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer
}))
