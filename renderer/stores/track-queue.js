'use strict'

import { ReplaySubject, Subject, merge } from 'rxjs'
import { scan, pluck, shareReplay } from 'rxjs/operators'

const actions$ = new Subject()

const queue$ = merge(actions$, new ReplaySubject()).pipe(
  scan(
    ({ list, idx }, action) => {
      if (action.add) {
        list = [...list, ...action.add]
      } else if (action.clear) {
        list = []
        idx = 0
      } else if (list.length) {
        if (
          action.idx !== undefined &&
          action.idx >= 0 &&
          action.idx < list.length
        ) {
          idx = action.idx
        } else if (action.next) {
          idx = (idx + 1) % list.length
        } else if (action.previous) {
          idx = idx === 0 ? list.length - 1 : idx - 1
        } else if (action.remove >= 0 && action.remove < list.length) {
          if (action.remove < idx) {
            idx--
          } else if (action.remove === idx && idx === list.length - 1) {
            idx = 0
          }
          list.splice(action.remove, 1)
        }
      }
      current$.next(list[idx])
      return { list, idx }
    },
    { idx: 0, list: [] }
  ),
  shareReplay()
)

const index$ = queue$.pipe(pluck('idx'))

const current$ = new ReplaySubject()

const tracks$ = queue$.pipe(pluck('list'))

// first init
queue$.subscribe()
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
  actions$.next({ add: Array.isArray(values) ? values : [values] })
}

export function clear() {
  actions$.next({ clear: true })
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

export function remove(idx) {
  actions$.next({ remove: idx })
}
