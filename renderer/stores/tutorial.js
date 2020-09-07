'use strict'

import { BehaviorSubject, Subject } from 'rxjs'
import { location } from 'svelte-spa-router'
import { albums } from './albums'
import { playlists } from './playlists'
import { tracks } from './track-queue'
import { tick } from 'svelte'

const steps = [
  {
    anchorId: 'locale',
    messageKey: 'tutorial.chooseLocale',
    nextButtonKey: 'alright',
    annotation: {
      top: '60%'
    }
  },
  {
    anchorId: 'folder',
    messageKey: 'tutorial.findMusic',
    listen: () => awaitsEvent(albums, albums => albums.length > 0)
  },
  {
    anchorId: 'firstAlbum',
    messageKey: 'tutorial.playOrEnqueue',
    annotation: {
      top: '20%',
      left: '50%'
    },
    listen: () => awaitsEvent(tracks, tracks => tracks.length > 0)
  },
  {
    anchorId: 'queue',
    messageKey: 'tutorial.makePlaylist',
    annotation: {
      left: '15%'
    },
    listen: () => awaitsEvent(playlists, playlists => playlists.length > 0)
  },
  {
    anchorId: 'to-playlists',
    messageKey: 'tutorial.navigateToPlaylist',
    annotation: {
      top: '30%',
      left: '45%'
    },
    listen: () => awaitsEvent(location, location => location === '/playlist')
  },
  {
    messageKey: 'tutorial.end',
    nextButtonKey: `let's go`
  }
]

const current$ = new BehaviorSubject(null)

const clickNextButton$ = new Subject()

function awaitsEvent(store, criteria = () => true) {
  const subscription = store.subscribe(async value => {
    if (criteria(value)) {
      await tick()
      if (typeof subscription === 'function') {
        subscription()
      } else {
        subscription.unsubscribe()
      }
      next()
    }
  })
}

function next() {
  const idx = steps.indexOf(current$.value)
  if (idx === -1 || idx < steps.length - 1) {
    const nextStep = steps[idx + 1]
    if (nextStep.listen) {
      nextStep.listen()
    } else {
      awaitsEvent(clickNextButton$)
    }
    current$.next(nextStep)
  } else {
    current$.next(null)
  }
}

export async function start() {
  await tick()
  current$.next()
  next()
}

export const current = current$.asObservable()

export function handleNextButtonClick() {
  clickNextButton$.next()
}
