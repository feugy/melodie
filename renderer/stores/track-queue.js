'use strict'

import { get } from 'svelte/store'
import { ReplaySubject, Subject, merge, BehaviorSubject } from 'rxjs'
import { scan, pluck, shareReplay } from 'rxjs/operators'
import { fromServerChannel } from '../utils'

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
        } else if (action.changed) {
          for (let i = 0; i < list.length; i++) {
            if (list[i].id === action.changed.id) {
              list[i] = action.changed
            }
          }
        } else if (action.move) {
          const { from, to } = action.move
          if (from >= 0 && from < list.length && to >= 0 && to < list.length) {
            const [moved] = list.splice(from, 1)
            list.splice(to, 0, moved)
            if (idx === from) {
              idx = to
            } else if (to < idx && from > idx) {
              idx++
            } else if (to > idx && from < idx) {
              idx--
            }
          }
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

const current$ = new BehaviorSubject()

const tracks$ = queue$.pipe(pluck('list'))

fromServerChannel(`track-change`).subscribe(changed =>
  actions$.next({ changed })
)

fromServerChannel(`track-removal`).subscribe(removedId => {
  let idx = 0
  while (idx !== -1) {
    const queued = get(tracks$)
    idx = queued.findIndex(({ id }) => id === removedId)
    remove(idx)
  }
})

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

export function playNext() {
  actions$.next({ next: true })
}

export function playPrevious() {
  actions$.next({ previous: true })
}

export function jumpTo(idx) {
  actions$.next({ idx })
}

export function remove(idx) {
  actions$.next({ remove: idx })
}

export function move(from, to) {
  actions$.next({ move: { from, to } })
}
