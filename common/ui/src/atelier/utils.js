import { recordEvent } from '@atelier-wb/svelte'

import { closeConnection, initConnection } from '../utils'

let connection
let disconnected = false

export function mockWebsocket(
  mock = () => null,
  settings = {
    providers: { audiodb: {}, discogs: {} },
    enqueueBehaviour: {},
    isBroadcasting: false
  },
  autoconnect = true
) {
  return async () => {
    closeConnection()
    disconnected = false
    window.WebSocket = function () {
      connection = this
      if (disconnected) {
        setTimeout(() => this.onclose(new Error('Forced disconnection')), 0)
        return this
      }
      this.send = rawData => {
        const { invoked, args, id } = JSON.parse(rawData)
        recordEvent('invoke', invoked, ...args)
        const result = mock(invoked, ...args)
        this.onmessage({ data: JSON.stringify({ id, result }) })
      }
      this.close = () => {}
      setTimeout(
        () =>
          this.onmessage?.({
            data: JSON.stringify({ token: 'test-token', settings })
          }),
        0
      )
      return this
    }
    if (autoconnect) {
      // has to be the same port used when starting Atelier
      await initConnection('ws://localhost:3000/', 'totp', () => {})
    }
  }
}

export function disconnectWebsocket() {
  disconnected = true
  if (connection) {
    connection.onclose()
  }
}
