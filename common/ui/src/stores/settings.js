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
import { init as initTotp, totp } from './totp'

const reconnectDelay = 100

let reconnectTimeout

let port

const settings$ = new BehaviorSubject({
  providers: { audiodb: {}, discogs: {} },
  enqueueBehaviour: {},
  isBroadcasting: false
})

const connected$ = new BehaviorSubject(null)
let connSubscription

export const settings = settings$.asObservable()

export const connected = connected$.asObservable()

// export the whole subject to allow testing, since it's not easy to change JSDom userAgent within Jest
export const isDesktop = new BehaviorSubject(
  /electron/i.test(navigator.userAgent)
)

async function connect(address) {
  port = address.split(':')[2]
  clearTimeout(reconnectTimeout)

  const handleLostConnection = () => {
    connected$.next(false)
    reconnectTimeout = setTimeout(() => connect(address), reconnectDelay)
  }

  connected$.next(
    await initConnection(address, handleLostConnection, () => get(totp))
  )
}

export async function init(address, totpSecret, totp) {
  initTotp(totpSecret, totp)

  connected$.next(null)
  await new Promise(resolve => {
    connSubscription?.unsubscribe()
    connSubscription = connected$.subscribe(async connected => {
      if (connected) {
        connSubscription.unsubscribe()
        fromServerEvent('settings-saved').subscribe(saved => {
          settings$.next(saved)
        })
        settings$.next(await invoke('settings.get'))
        resolve()
      }
    })

    connect(address)
  })
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
  // connect without bail on the new port
  connect(`ws://localhost:${port}`)
}

export function saveBroadcastPort(port) {
  invoke('settings.setBroadcastPort', port)
}
