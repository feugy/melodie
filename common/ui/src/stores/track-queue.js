import parse from 'fast-json-parse'
import { knuthShuffle } from 'knuth-shuffle'
import { BehaviorSubject, merge, ReplaySubject, Subject } from 'rxjs'
import { map, pluck, scan, shareReplay } from 'rxjs/operators'
import { get } from 'svelte/store'

import { createClickObservable, fromServerEvent } from '../utils'
import { settings } from './settings'

const actions$ = new Subject()

export const storageKey = 'track-list'

const queue$ = merge(actions$, new ReplaySubject()).pipe(
  scan(
    ({ list, idx, backup }, action) => {
      if (action.shuffle && !backup) {
        backup = [...list]
        if (list.length) {
          const [current] = list.splice(idx, 1)
          knuthShuffle(list)
          list.unshift(current)
        }
        idx = 0
      } else if (backup && action.restore) {
        if (list[idx]) {
          const { id } = list[idx]
          idx = backup.findIndex(track => id === track.id)
        }
        list = [...backup]
        backup = undefined
      } else if (action.add && !backup) {
        list = [...list, ...action.add]
      } else if (action.add && backup) {
        const incoming = [...list.slice(idx + 1), ...action.add]
        list = [...list.slice(0, idx + 1), ...knuthShuffle(incoming)]
        backup = [...backup, ...action.add]
      } else if (action.clear) {
        backup = backup ? [] : undefined
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
          const [{ id }] = list.splice(action.remove, 1)
          if (backup) {
            for (let i = 0; i < backup.length; i++) {
              if (backup[i].id === id) {
                backup.splice(i, 1)
                break
              }
            }
          }
        } else if (action.changed) {
          for (const changed of action.changed) {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === changed.id) {
                list[i] = changed
              }
            }
            if (backup) {
              for (let i = 0; i < backup.length; i++) {
                if (backup[i].id === changed.id) {
                  backup[i] = changed
                }
              }
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
      try {
        localStorage.setItem(storageKey, JSON.stringify({ list, idx }))
      } catch (error) {
        console.warn(
          { error },
          `failed to write track queue in local storage: ${error.message}`
        )
      }
      current$.next(list[idx])
      next$.next(idx < list.length - 1 ? list[idx + 1] : null)
      return { list, idx, backup }
    },
    { idx: 0, list: [] }
  ),
  shareReplay()
)

const index$ = queue$.pipe(pluck('idx'))

const current$ = new BehaviorSubject()

const next$ = new BehaviorSubject()

const tracks$ = queue$.pipe(pluck('list'))

const isShuffling$ = queue$.pipe(map(({ backup }) => Array.isArray(backup)))

fromServerEvent(`track-changes`).subscribe(changed =>
  actions$.next({ changed })
)

fromServerEvent(`track-removals`).subscribe(removedIds => {
  for (const removed of removedIds) {
    let idx = 0
    while (idx !== -1) {
      const queued = get(tracks$)
      idx = queued.findIndex(({ id }) => id === removed)
      remove(idx)
    }
  }
})

fromServerEvent(`play-tracks`).subscribe(tracks => {
  add(tracks, true)
})

// first init
let initialState
try {
  initialState = parse(localStorage.getItem(storageKey)).value
} catch (error) {
  console.warn(
    { error },
    `failed to read track queue in local storage: ${error.message}`
  )
  localStorage.clearItem(storageKey)
}
queue$.subscribe()
clear()
if (initialState && Array.isArray(initialState.list) && 'idx' in initialState) {
  add(initialState.list)
  jumpTo(initialState.idx)
}

let playOnClick
let clearBeforePlay = true

settings.subscribe(value => {
  if (value) {
    playOnClick = !value.enqueueBehaviour.onClick
    clearBeforePlay = value.enqueueBehaviour.clearBefore
  }
})

export const tracks = tracks$
export const current = current$.asObservable()
export const next = next$.asObservable()
export const index = index$
export const isShuffling = isShuffling$

export function add(values, play = false) {
  const actions = [{ add: Array.isArray(values) ? values : [values] }]
  if (play) {
    if (clearBeforePlay) {
      actions.unshift({ clear: true })
    } else {
      actions.push({ idx: get(tracks$).length })
    }
  }
  for (const action of actions) {
    actions$.next(action)
  }
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

export function shuffle() {
  actions$.next({ shuffle: true })
}

export function unshuffle() {
  actions$.next({ restore: true })
}

export function createClickToAddObservable() {
  return createClickObservable(
    function onClick(track) {
      add(track, playOnClick)
    },
    function onDouble(track) {
      add(track, !playOnClick)
    }
  )
}
