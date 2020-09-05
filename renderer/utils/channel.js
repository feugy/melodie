'use strict'

const electron = require('electron')
import { fromEvent } from 'rxjs'

const observables = new Map()

export function fromServerChannel(channel) {
  if (!observables.has(channel)) {
    observables.set(
      channel,
      fromEvent(electron.ipcRenderer, channel, (event, args) => args)
    )
  }
  return observables.get(channel)
}
