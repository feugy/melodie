'use strict'

import { wrap, replace } from 'svelte-spa-router'
import Albums from './routes/album.svelte'
import AlbumDetails from './routes/album/[id].svelte'

export const routes = {
  '/album': Albums,
  '/album/:id': AlbumDetails,
  '*': wrap(Albums, null, () => {
    replace('/album')
    return true
  })
}
