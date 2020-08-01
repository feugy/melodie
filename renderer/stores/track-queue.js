'use strict'

import { ReplaySubject, Subject, merge } from 'rxjs'
import { scan, pluck, shareReplay } from 'rxjs/operators'

const tracks$ = new ReplaySubject().pipe(
  scan((list, added) => (added === null ? [] : [...list, ...added]), [])
)

const current$ = new ReplaySubject()

const actions$ = new Subject()

const index$ = merge(actions$, tracks$).pipe(
  scan(
    ({ list, idx }, action) => {
      if (Array.isArray(action)) {
        list = action
        if (idx >= list.length) {
          idx = 0
        }
      } else if (
        action.idx !== undefined &&
        action.idx >= 0 &&
        action.idx < list.length
      ) {
        idx = action.idx
      } else if (action.next) {
        idx = (idx + 1) % list.length
      } else if (action.previous) {
        idx = idx === 0 ? list.length - 1 : idx - 1
      }
      current$.next(list[idx])
      return { list, idx }
    },
    { idx: 0 }
  ),
  pluck('idx'),
  shareReplay()
)

// first init
index$.subscribe()
clear()

export const tracks = {
  subscribe: tracks$.subscribe.bind(tracks$)
}

export const current = {
  subscribe: current$.subscribe.bind(current$)
}

export const index = {
  subscribe: index$.subscribe.bind(index$)
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

export function jumpTo(idx) {
  actions$.next({ idx })
}
