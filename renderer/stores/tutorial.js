'use strict'

import { BehaviorSubject, Subject } from 'rxjs'
import { location, replace } from 'svelte-spa-router'
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

let allowNavigation
const whitelist = ['/album', '/playlist', '/settings']

function preventNavigation() {
  let currentLoc = null
  allowNavigation = location.subscribe(async value => {
    if (currentLoc === null || whitelist.includes(value)) {
      currentLoc = value
    } else {
      await tick()
      replace(currentLoc)
    }
  })
}

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
    allowNavigation()
  }
}

export async function start() {
  await tick()
  preventNavigation()
  current$.next()
  next()
}

export const current = current$.asObservable()

export function handleNextButtonClick() {
  clickNextButton$.next()
}
