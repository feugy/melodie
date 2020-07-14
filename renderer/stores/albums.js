'use strict'

import produce from 'immer'
import { BehaviorSubject, Observable, using, iif, of } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import { invoke } from '../utils'

const store = new BehaviorSubject([])

export const albums = {
  subscribe: store.subscribe.bind(store)
}

export function reset() {
  store.next([])
}

export async function list() {
  store.next([])
  let subscriber

  const makeCaller = arg =>
    of(arg).pipe(
      flatMap(arg => invoke('listEngine.listAlbums', arg)),
      map(data => {
        const { size, from, total, results } = data
        store.next(produce(store.value, draft => [...draft, ...results]))
        subscriber.next({ from: from + results.length, size, total })
      })
    )

  const subscription = Observable.create(s => {
    subscriber = s
    subscriber.next({ total: 1 })
  })
    .pipe(
      flatMap(arg =>
        iif(
          () => store.value.length < arg.total,
          makeCaller(arg),
          using(() => subscription.unsubscribe())
        )
      )
    )
    .subscribe()
}

export async function loadTracks(album) {
  const result = await invoke('listEngine.listTracksOf', album)

  store.next(
    produce(store.value, draft => {
      const idx = draft.findIndex(({ name }) => name === album.name)
      if (idx >= 0) {
        draft[idx].tracks = result
      }
    })
  )
}
