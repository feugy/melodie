'use strict'

import { action } from '@storybook/addon-actions'
import { initConnection } from '../src/utils'

const invokeAction = action('invoke')

let close

export function websocketResponse(mock = () => null) {
  return async () => {
    if (close) {
      close()
    }
    window.WebSocket = function() {
      this.send = (rawData) => {
        const { invoked, args, id } = JSON.parse(rawData)
        invokeAction(invoked, ...args)
        const result = mock(invoked, ...args)
        this.onmessage({ data: JSON.stringify({ id, result }) })
      }
      this.close = () => {}
      setTimeout(() => this.onopen(), 0)
      return this
    }

    ;({ close } = await initConnection('unused'))
    return {}
  }
}
