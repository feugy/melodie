import '../common'
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/svelte'
import * as matchers from 'jest-extended'
import { afterEach, expect, vi } from 'vitest'

expect.extend(matchers)
afterEach(() => cleanup())

// jsdom does not support loading and playback operations
window.HTMLMediaElement.prototype.load = vi.fn()
window.HTMLMediaElement.prototype.play = vi.fn()
window.HTMLMediaElement.prototype.pause = vi.fn()

// replaces jsdom's requestAnimationFrame because it messes with Svelte transitions
// shim: https://gist.github.com/paulirish/1579671
// bugreport: https://discord.com/channels/457912077277855764/1002142769277575218/1002469809277108224
let lastTime = 0
window.requestAnimationFrame = function (callback) {
  const currTime = new Date().getTime()
  let timeToCall = Math.max(0, 16 - (currTime - lastTime))
  const id = window.setTimeout(function () {
    callback(currTime + timeToCall)
  }, timeToCall)
  lastTime = currTime + timeToCall
  return id
}
window.cancelAnimationFrame = function (id) {
  window.clearTimeout(id)
}

// jsdom does not support mediaSession yet
navigator.mediaSession = {
  setActionHandler: vi.fn(),
  metadata: null
}
window.fetch = vi.fn()

window.IntersectionObserver = function (callback) {
  return {
    observe: target => {
      callback([{ target, isIntersecting: true }])
    },
    unobserve: vi.fn()
  }
}

window.ResizeObserver = function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn()
  }
}

window.fetch = vi.fn().mockReturnValue(new Promise(resolve => resolve()))

vi.mock('../utils/connection', () => {
  const { Subject } = require('rxjs')
  const { filter, pluck } = require('rxjs/operators')
  const serverEmitter = new Subject()
  const lastInvokation = new Subject()
  const observables = new Map()
  vi.spyOn(console, 'trace').mockImplementation(() => {})
  return {
    enhanceUrl: url => url,
    invoke: vi.fn(),
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
    initConnection: vi.fn(),
    closeConnection: vi.fn()
  }
})

global.RXJS_VERSION = 'a.b.c'
global.UNOCSS_VERSION = 'x.y.z'
