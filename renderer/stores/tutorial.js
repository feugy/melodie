'use strict'

import { writable } from 'svelte/store'
import { BehaviorSubject } from 'rxjs'
import { albums } from './albums'
import { tracks } from './track-queue'

const steps = [
  {
    messageKey: 'tutorial.chooseLocale',
    anchorId: 'locale',
    top: '60%',
    nextButtonText: 'next'
  },
  {
    messageKey: 'tutorial.findMusic',
    anchorId: 'folder',
    top: null
  },
  {
    messageKey: 'tutorial.playOrEnqueue',
    anchorId: 'firstAlbum',
    top: '70%'
  },
  {
    messageKey: 'tutorial.makePlaylist',
    anchorId: 'queue',
    left: '15%'
  }
]

const currentStep$ = new BehaviorSubject(steps[0])

const albumSub = albums.subscribe(albums => {
  if (albums.length > 0) {
    albumSub.unsubscribe()
    onNext()
  }
})

const queueSub = tracks.subscribe(tracks => {
  if (tracks.length > 0) {
    queueSub.unsubscribe()
    onNext()
  }
})

export const isEnabled = new writable(false)

export const currentStep = currentStep$.asObservable()

export function onNext() {
  const idx = steps.indexOf(currentStep$.value)
  if (idx < steps.length - 1) {
    currentStep$.next(steps[idx + 1])
  }
}
