'use strict'

import produce from 'immer'
import { BehaviorSubject, Observable, using, iif, of } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import { invoke } from '../utils'

function observableStore(initial) {
  let store = new BehaviorSubject(initial)
  store.set = store.next
  return store
}

export const albums = observableStore([])

export async function list() {
  albums.set([])
  let subscriber

  const makeCaller = arg =>
    of(arg).pipe(
      flatMap(arg => invoke('listEngine.listAlbums', arg)),
      map(data => {
        const { size, from, total, results } = data
        albums.set(produce(albums.value, draft => [...draft, ...results]))
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
          () => albums.value.length < arg.total,
          makeCaller(arg),
          using(() => subscription.unsubscribe())
        )
      )
    )
    .subscribe()
}

export async function open(album) {
  const result = await invoke('listEngine.listTracksOf', album)

  albums.set(
    produce(albums.value, draft => {
      const idx = draft.findIndex(({ name }) => name === album.name)
      if (idx >= 0) {
        draft[idx].tracks = result
      }
    })
  )
}
