'use strict'

import { ReplaySubject, Subject, merge } from 'rxjs'
import { scan, pluck, shareReplay } from 'rxjs/operators'

const tracks$ = new ReplaySubject().pipe(
  scan((list, added) => (added === null ? [] : [...list, ...added]), [])
)

// first init
clear()

const actions$ = new Subject()

const current$ = merge(actions$, tracks$).pipe(
  scan(({ list, current }, action) => {
    if (Array.isArray(action)) {
      list = action
      if (!list.includes(current)) {
        current = undefined
      }
    }
    const idx = list.indexOf(current)
    if (idx === -1) {
      current = list[0]
    } else if (action.next) {
      current = list[(idx + 1) % list.length]
    } else if (action.previous) {
      current = list[idx === 0 ? list.length - 1 : idx - 1]
    }
    return { list, current }
  }, {}),
  pluck('current'),
  shareReplay()
)

export const tracks = {
  subscribe: tracks$.subscribe.bind(tracks$)
}

export const current = {
  subscribe: current$.subscribe.bind(current$)
}

export function add(values, play = false) {
  if (play) {
    clear()
  }
  tracks$.next(Array.isArray(values) ? values : [values])
}

export function clear() {
  tracks$.next(null)
}

export function next() {
  actions$.next({ next: true })
}

export function previous() {
  actions$.next({ previous: true })
}
