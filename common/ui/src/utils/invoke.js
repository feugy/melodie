'use strict'

// note: do not destructure, as it makes it harder to mock in Storybook
const electron = require('electron')
import { BehaviorSubject } from 'rxjs'

const lastInvokation$ = new BehaviorSubject()

export const lastInvokation = lastInvokation$.asObservable()

export async function invoke(invoked, ...args) {
  lastInvokation$.next({ invoked, args })
  return electron.ipcRenderer.invoke('remote', ...invoked.split('.'), ...args)
}
