'use strict'

import { BehaviorSubject, filter, map } from 'rxjs'
import { get } from 'svelte/store'
import { push } from 'svelte-spa-router'
import {
  invoke,
  fromServerEvent,
  initConnection,
  closeConnection
} from '../utils'
import { init as initTotp, totp } from './totp'

const tokenKey = 'token'
let reconnectTimeout
let totpSubscription

function cleanPending() {
  clearTimeout(reconnectTimeout)
  totpSubscription?.unsubscribe()
}

let port

const settings$ = new BehaviorSubject({
  providers: { audiodb: {}, discogs: {} },
  enqueueBehaviour: {},
  isBroadcasting: false
})

const connected$ = new BehaviorSubject(null)
let connSubscription

const initialToken = sessionStorage.getItem(tokenKey)
const token$ = new BehaviorSubject(initialToken)
token$.subscribe(value => {
  console.trace(`updating client token with ${value}`)
  if (value) {
    sessionStorage.setItem(tokenKey, value)
  } else {
    sessionStorage.removeItem(tokenKey)
  }
})

export const settings = settings$.asObservable()

export const connected = connected$.asObservable()

export const tokenUpdated = token$.pipe(map(() => {}))

// export the whole subject to allow testing, since it's not easy to change JSDom userAgent within Jest
export const isDesktop = new BehaviorSubject(
  /electron/i.test(navigator.userAgent)
)

async function connect(address, reconnectDelay) {
  cleanPending()
  port = address.split(':')[2]
  console.trace(
    `connecting to ${address} with initial token ${initialToken}...`
  )
  const token = token$.value

  if (!isDesktop.value && !token) {
    totpSubscription = totp.pipe(filter(Boolean)).subscribe({
      next: async totp => {
        const response = await fetch(`/token`, {
          method: 'POST',
          body: totp
        })
        if (response.ok) {
          token$.next(await response.text())
          connect(address, reconnectDelay)
        }
      }
    })
  } else {
    const settings = await initConnection(
      address,
      token,
      () => {
        console.trace(`disconnected`)
        connected$.next(false)
        reconnectTimeout = setTimeout(
          () => connect(address, reconnectDelay),
          reconnectDelay
        )
      },
      token => token$.next(token)
    )
    if (settings) {
      console.trace(`connection established`)
      settings$.next(settings)
    } else {
      console.trace(`connection failed`)
    }
    connected$.next(Boolean(settings))
  }
}

export async function init(address, totpSecret, totp, reconnectDelay = 5000) {
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

    connect(address, reconnectDelay)
    initTotp(totpSecret, totp)
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
