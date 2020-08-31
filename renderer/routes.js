'use strict'

import { wrap, replace } from 'svelte-spa-router'
import Albums from './routes/album.svelte'
import AlbumDetails from './routes/album/[id].svelte'
import Artists from './routes/artist.svelte'
import ArtistDetails from './routes/artist/[id].svelte'
import Playlists from './routes/playlist.svelte'
import SearchResults from './routes/search/[searched].svelte'
import Settings from './routes/settings.svelte'

export const routes = {
  '/album': Albums,
  '/album/:id': AlbumDetails,
  '/artist': Artists,
  '/artist/:id': ArtistDetails,
  '/playlist': Playlists,
  '/search/:searched': SearchResults,
  '/settings': Settings,
  '*': wrap(Albums, null, () => {
    replace('/album')
    return true
  })
}
