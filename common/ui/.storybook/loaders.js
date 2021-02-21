'use strict'

import { action } from '@storybook/addon-actions'
import { initConnection, closeConnection } from '../src/utils'

const invokeAction = action('invoke')

let connection
let disconnected = false

export function websocketResponse(
  storyTitle,
  mock = () => null,
  autoconnect = true
) {
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
        invokeAction(invoked, ...args)
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
    return {}
  }
}

export function disconnectWebsocket() {
  disconnected = true
  if (connection) {
    connection.onclose()
  }
}

export function runCustom(storyTitle, fn) {
  return () => fn()
}
