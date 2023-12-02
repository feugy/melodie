import { configureToolshot } from '@atelier-wb/toolshot'
import { join } from 'path'
import { beforeAll, vi } from 'vitest'

import { initConnection, invoke } from '../utils/connection'

vi.mock('qrcode', () => ({ default: { toCanvas: vi.fn() } }))

beforeAll(() => {
  // since utils/connections are mocked in vi-setup.js
  // we implement simplistic behavior to leverage fixtures data from atlier/utils's mockWebsocket()
  initConnection.mockResolvedValue({
    folders: [],
    providers: { audiodb: {}, discogs: {} },
    enqueueBehaviour: {},
    isBroadcasting: false
  })
  invoke.mockImplementation(
    (invoked, ...args) =>
      new Promise(resolve => {
        const ws = new WebSocket()
        ws.onopen = () => {}
        ws.onclose = () => {}
        ws.onmessage = ({ data }) => {
          ws.onmessage = undefined
          resolve(JSON.parse(data).result)
        }
        ws.send(JSON.stringify({ invoked, args }))
      })
  )
})

configureToolshot({
  folder: join(__dirname, '..'),
  include:
    '^((?!Dialogue|MediaSelector|Snackbar|SystemNotifier|TrackDropdown).)*\\.tools\\.svelte$',
  timeout: 10e3
})
