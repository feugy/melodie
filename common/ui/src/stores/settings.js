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

let reconnectTimeout
let totpSubscription

function cleanPending() {
  clearTimeout(reconnectTimeout)
  totpSubscription?.unsubscribe()
  reconnectTimeout = null
  totpSubscription = null
}

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

async function connect(address, reconnectDelay) {
  cleanPending()
  port = address.split(':')[2]

  const handleLostConnection = () => {
    const current = get(totp)
    totpSubscription = totp.subscribe({
      next: value => {
        // we must compare new and old value since totp is a BehaviourSubject and will issue its value upon subscription
        if (value && value !== current) {
          connect(address, reconnectDelay)
        }
      }
    })
    reconnectTimeout = setTimeout(
      () => connect(address, reconnectDelay),
      reconnectDelay
    )
    connected$.next(false)
  }

  const settings = await initConnection(
    address,
    get(totp),
    handleLostConnection
  )
  if (settings) {
    settings$.next(settings)
  }
  connected$.next(Boolean(settings))
}

export async function init(address, totpSecret, totp, reconnectDelay = 1000) {
  cleanPending()
  connected$.next(null)
  await new Promise(resolve => {
    connSubscription?.unsubscribe()
    connSubscription = connected$.subscribe(async connected => {
      if (connected) {
        connSubscription.unsubscribe()
        fromServerEvent('settings-saved').subscribe(saved => {
          settings$.next(saved)
        })
        resolve()
      }
    })

    initTotp(totpSecret, totp)
    connect(address, reconnectDelay)
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
  connected$.next(false)
  // toggling broadcast on and off is a desktop feature: url will always be localhost.
  // slightly wait for server to have restarted before trying again.
  setTimeout(() => connect(`ws://localhost:${port}`, 100), 500)
}

export function saveBroadcastPort(port) {
  invoke('settings.setBroadcastPort', port)
}
