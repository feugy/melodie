'use strict'

import { ReplaySubject, BehaviorSubject } from 'rxjs'
import { scan, mergeMap, map } from 'rxjs/operators'
import { get } from 'svelte/store'
import { invoke } from '../utils'

const collator = new Intl.Collator([], { numeric: true })

const albums$ = new ReplaySubject().pipe(
  scan(
    (all, added) =>
      !added
        ? []
        : [...all, ...added].sort((a, b) => collator.compare(a.name, b.name)),
    []
  )
)
const artists$ = new ReplaySubject().pipe(
  scan(
    (all, added) =>
      !added
        ? []
        : [...all, ...added].sort((a, b) => collator.compare(a.name, b.name)),
    []
  )
)
const tracks$ = new ReplaySubject().pipe(
  scan(
    (all, added) =>
      !added
        ? []
        : [...all, ...added].sort((a, b) =>
            collator.compare(a.tags.title, b.tags.title)
          ),
    []
  )
)

const sum$ = new ReplaySubject().pipe(
  scan(
    (sum, added) =>
      !added
        ? 0
        : sum +
          added.artists.length +
          added.albums.length +
          added.tracks.length,
    0
  )
)

export const albums = {
  subscribe: albums$.subscribe.bind(albums$)
}
export const artists = {
  subscribe: artists$.subscribe.bind(artists$)
}
export const tracks = {
  subscribe: tracks$.subscribe.bind(tracks$)
}

let searchSubscription = null

export function clear() {
  albums$.next(null)
  artists$.next(null)
  tracks$.next(null)
  sum$.next(null)
}

export function search(text, size = 10) {
  if (searchSubscription) {
    searchSubscription.unsubscribe()
  }
  clear()
  const request$ = new BehaviorSubject({ text, size })

  searchSubscription = request$
    .pipe(
      mergeMap(({ text, ...args }) => invoke(`listEngine.search`, text, args)),
      map(data => {
        const { size, from, totalSum, albums, artists, tracks } = data
        sum$.next(data)
        if (albums.length) {
          albums$.next(albums)
        }
        if (artists.length) {
          artists$.next(artists)
        }
        if (tracks.length) {
          tracks$.next(tracks)
        }
        if (get(sum$) < totalSum) {
          // TODO bof...
          request$.next({ from: from + size, size, text })
        } else {
          request$.complete()
          searchSubscription = null
        }
      })
    )
    .subscribe()
}

// first init
clear()
