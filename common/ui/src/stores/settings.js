'use strict'

import { BehaviorSubject } from 'rxjs'
import { get } from 'svelte/store'
import { push } from 'svelte-spa-router'
import {
  invoke,
  fromServerEvent,
  initConnection,
  closeConnection
} from '../utils'

const reconnectDelay = 100

let reconnectTimeout

const settings$ = new BehaviorSubject({
  providers: { audiodb: {}, discogs: {} },
  enqueueBehaviour: {},
  isBroadcasting: false
})

const address$ = new BehaviorSubject(null)

const connected$ = new BehaviorSubject(false)

export const settings = settings$.asObservable()

export const connected = connected$.asObservable()

export const address = address$.asObservable()

// export the whole subject to allow testing, since it's not easy to change JSDom userAgent within Jest
export const isDesktop = new BehaviorSubject(
  /electron/i.test(navigator.userAgent)
)

async function connect(address, bail = false) {
  connected$.next(false)
  clearTimeout(reconnectTimeout)

  // never bail on connection lost
  const handleLostConnection = () => connect(address)

  try {
    await initConnection(address, handleLostConnection)
    connected$.next(true)
  } catch (err) {
    if (bail) {
      throw err
    }
    // when not bailing, schedule a new attempt, but stop waiting
    reconnectTimeout = setTimeout(handleLostConnection, reconnectDelay)
  }
}

export async function init(address) {
  try {
    await connect(address, true)
    fromServerEvent('settings-saved').subscribe(saved => {
      settings$.next(saved)
    })
    settings$.next(await invoke('settings.get'))
    address$.next(await invoke('settings.getUIAddress'))
  } catch {
    // silently ignores errors
  }
}

export async function saveLocale(value) {
  await invoke('settings.setLocale', value)
}

export async function askToAddFolder() {
  if (!get(isDesktop)) {
    throw new Error('Operation not supported on browser')
  }
  const settings = await invoke('settings.addFolders')
  if (settings) {
    push('/album')
    settings$.next(settings)
  }
}

export function removeFolder(folder) {
  invoke('settings.removeFolder', folder)
}

export function saveAudioDBKey(key) {
  invoke('settings.setAudioDBKey', key)
}

export function saveDiscogsToken(token) {
  invoke('settings.setDiscogsToken', token)
}

export function saveEnqueueBehaviour({ onClick, clearBefore }) {
  invoke('settings.setEnqueueBehaviour', { onClick, clearBefore })
}

export async function toggleBroadcast() {
  if (!get(isDesktop)) {
    throw new Error('Operation not supported on browser')
  }
  settings$.next(await invoke('settings.toggleBroadcast'))
  closeConnection()
  // toggling broadcast on and off is a desktop feature: url will always be localhost.
  // connect without bail on the new address
  connect(`ws://localhost:${get(address).split(':')[2]}`)
}

export function saveBroadcastPort(port) {
  invoke('settings.setBroadcastPort', port)
}
