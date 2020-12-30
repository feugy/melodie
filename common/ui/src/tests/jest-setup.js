'use strict'

import '../common'

// jsdom does not support loading and playback operations
window.HTMLMediaElement.prototype.load = jest.fn()
window.HTMLMediaElement.prototype.play = jest.fn()
window.HTMLMediaElement.prototype.pause = jest.fn()

// jsdom does not support mediaSession yet
navigator.mediaSession = {
  setActionHandler: jest.fn(),
  metadata: null
}
window.fetch = jest.fn()

window.IntersectionObserver = function () {
  return {
    observe: jest.fn(),
    unobserve: jest.fn()
  }
}

window.ResizeObserver = function () {
  return {
    observe: jest.fn(),
    unobserve: jest.fn()
  }
}

jest.mock('../utils/connection', () => {
  const { Subject } = require('rxjs')
  const { filter, pluck } = require('rxjs/operators')
  const serverEmitter = new Subject()
  const lastInvokation = new Subject()
  const observables = new Map()
  return {
    invoke: jest.fn(),
    // same implementation as real, except the source
    fromServerEvent(name) {
      if (!observables.has(name)) {
        observables.set(
          name,
          serverEmitter.pipe(
            filter(msg => msg.event === name),
            pluck('args')
          )
        )
      }
      return observables.get(name)
    },
    lastInvokation,
    // usefull for simulating server events
    serverEmitter,
    initConnection: jest.fn(),
    closeConnection: jest.fn()
  }
})

global.RXJS_VERSION = 'a.b.c'
global.TAILWINDCSS_VERSION = 'x.y.z'
