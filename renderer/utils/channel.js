'use strict'

const electron = require('electron')
import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'

const observables = new Map()

export function fromServerChannel(channel) {
  if (!observables.has(channel)) {
    observables.set(
      channel,
      fromEvent(electron.ipcRenderer, channel).pipe(
        map(args => (Array.isArray(args) ? args[1] : undefined))
      )
    )
  }
  return observables.get(channel)
}
