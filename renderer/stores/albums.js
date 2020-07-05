'use strict'

import { writable } from 'svelte/store'
import invoke from '../utils/electron-remote'

export const albums = writable([])

export async function list() {
  const data = await invoke('listEngine.listAlbums')
  albums.set(data)
}

export async function open(album) {
  const result = await invoke(
    'searchEngine.searchBy',
    'tags:album',
    album.title
  )
  albums.update(values => {
    const idx = values.indexOf(album)
    return [
      ...(idx > 0 ? values.slice(0, idx) : []),
      album,
      ...(idx < values.length - 1 ? values.slice(idx + 1) : [])
    ]
  })
  album.tracks = result
}
