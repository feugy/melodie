'use strict'

import produce from 'immer'
import { BehaviorSubject } from 'rxjs'
import { invoke } from '../utils'

function observableStore(initial) {
  let store = new BehaviorSubject(initial)
  store.set = store.next
  return store
}

export const albums = observableStore([])

export async function list() {
  const data = await invoke('listEngine.listAlbums')
  albums.set(data)
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
