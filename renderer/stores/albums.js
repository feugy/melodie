'use strict'

import produce from 'immer'
import { BehaviorSubject, Observable, iif, of, using } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import { channelListener, invoke } from '../utils'

const collator = new Intl.Collator({ numeric: true })

const store = new BehaviorSubject([])

channelListener('album-change', album => {
  store.next(
    produce(store.value, draft => {
      const idx = draft.findIndex(({ id }) => id === album.id)
      if (idx !== -1) {
        if (album.trackIds.length) {
          draft[idx] = album
        } else {
          draft.splice(idx, 1)
        }
      } else {
        draft.push(album)
        draft.sort((a, b) => collator.compare(a.name, b.name))
      }
    })
  )
}).subscribe()

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
