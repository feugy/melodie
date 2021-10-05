'use strict'
import { recordEvent } from '@atelier-wb/svelte'
import { initConnection, closeConnection } from '../utils'

let connection
let disconnected = false

export function mockWebsocket(mock = () => null, autoconnect = true) {
  return async () => {
    closeConnection()
    disconnected = false
    window.WebSocket = function () {
      connection = this
      if (disconnected) {
        setTimeout(() => this.onerror(new Error('Forced disconnection')), 0)
        return this
      }
      this.send = rawData => {
        const { invoked, args, id } = JSON.parse(rawData)
        recordEvent('invoke', invoked, ...args)
        const result = mock(invoked, ...args)
        this.onmessage({ data: JSON.stringify({ id, result }) })
      }
      this.close = () => {}
      setTimeout(() => this.onopen(), 0)
      return this
    }
    if (autoconnect) {
      await initConnection('unused', () => {})
    }
  }
}

export function disconnectWebsocket() {
  disconnected = true
  if (connection) {
    connection.onclose()
  }
}
