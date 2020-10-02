'use strict'

import { BehaviorSubject } from 'rxjs'
import { push } from 'svelte-spa-router'
import { invoke } from '../utils'

const settings$ = new BehaviorSubject({
  providers: { audiodb: {}, discogs: {} },
  enqueueBehaviour: {}
})

// initial loading
invoke('settings.get').then(value => settings$.next(value))

export const settings = settings$.asObservable()

export async function saveLocale(value) {
  settings$.next(await invoke('settings.setLocale', value))
}

export async function askToAddFolder() {
  const settings = await invoke('settings.addFolders')
  if (settings) {
    push('/album')
    settings$.next(settings)
  }
}

export async function removeFolder(folder) {
  settings$.next(await invoke('settings.removeFolder', folder))
}

export async function saveAudioDBKey(key) {
  settings$.next(await invoke('settings.setAudioDBKey', key))
}

export async function saveDiscogsToken(token) {
  settings$.next(await invoke('settings.setDiscogsToken', token))
}

export async function saveEnqueueBehaviour({ onClick, clearBefore }) {
  settings$.next(
    await invoke('settings.setEnqueueBehaviour', { onClick, clearBefore })
  )
}
