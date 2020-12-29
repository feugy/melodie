'use strict'

import { ReplaySubject, BehaviorSubject } from 'rxjs'
import { scan, mergeMap, map } from 'rxjs/operators'
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
const total$ = new ReplaySubject()

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

const current$ = new ReplaySubject()

export const albums = albums$.asObservable()
export const artists = artists$.asObservable()
export const tracks = tracks$.asObservable()
export const total = total$.asObservable()
export const current = current$.asObservable()

let searchSubscription = null

export function clear() {
  albums$.next(null)
  artists$.next(null)
  tracks$.next(null)
  sum$.next(null)
  total$.next(0)
  current$.next(null)
}

export function search(text, size = 20) {
  if (searchSubscription) {
    searchSubscription.unsubscribe()
  }
  clear()
  current$.next(text)
  const request$ = new BehaviorSubject({ text, size })

  searchSubscription = request$
    .pipe(
      mergeMap(({ text, ...args }) => invoke(`tracks.search`, text, args)),
      map(data => {
        const { size, from, totalSum, albums, artists, tracks } = data
        total$.next(totalSum)
        let sum
        const sub = sum$.subscribe(v => (sum = v))
        sum$.next(data)
        sub.unsubscribe()
        if (albums.length) {
          albums$.next(albums)
        }
        if (artists.length) {
          artists$.next(artists)
        }
        if (tracks.length) {
          tracks$.next(tracks)
        }
        if (sum < totalSum) {
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
