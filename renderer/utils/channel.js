'use strict'

const { ipcRenderer } = require('electron')

export function channelListener(channel, listener) {
  return {
    subscribe() {
      function wrapper(event, ...args) {
        listener(...args)
      }
      ipcRenderer.on(channel, wrapper)
      return {
        unsubscribe: function () {
          ipcRenderer.removeListener(channel, wrapper)
        }
      }
    }
  }
}
