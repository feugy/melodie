<script context="module">
  import { fromEvent } from 'rxjs'

  // because svelte-spa-router is listening to hashchange in a module script
  // we have to do the same so we could intersept hash change before the new
  // route is applied
  const hashChanged$ = fromEvent(window, 'hashchange', evt => evt.oldURL)
</script>

<script>
  import Router, { wrap, replace } from 'svelte-spa-router'
  import { Subject } from 'rxjs'
  import { withLatestFrom, map, scan } from 'rxjs/operators'
  import Albums from '../../routes/album.svelte'
  import AlbumDetails from '../../routes/album/[id].svelte'
  import Artists from '../../routes/artist.svelte'
  import ArtistDetails from '../../routes/artist/[id].svelte'
  import Playlists from '../../routes/playlist.svelte'
  import PlaylistDetails from '../../routes/playlist/[id].svelte'
  import SearchResults from '../../routes/search/[searched].svelte'
  import Settings from '../../routes/settings.svelte'

  export let scrollable

  const routes = {
    '/album': Albums,
    '/album/:id': AlbumDetails,
    '/artist': Artists,
    '/artist/:id': ArtistDetails,
    '/playlist': Playlists,
    '/playlist/:id': PlaylistDetails,
    '/search/:searched': SearchResults,
    '/settings': Settings,
    '*': wrap(Albums, null, () => {
      replace('/album')
      return true
    })
  }

  const routeLoaded$ = new Subject()

  const scrollPositions$ = hashChanged$.pipe(
    map(url => ({
      location: new URL(url || 'file://').hash.slice(1),
      scrollTop: scrollable.scrollTop
    })),
    scan((memory, position) => {
      memory.set(position.location, position.scrollTop)
      return memory
    }, new Map())
  )

  routeLoaded$
    .pipe(
      map(({ detail: { location } }) => location),
      withLatestFrom(scrollPositions$),
      map(([location, memory]) => {
        if (memory.has(location)) {
          scrollable.scroll({ top: memory.get(location) })
        }
      })
    )
    .subscribe()
</script>

<Router {routes} on:routeLoaded={evt => routeLoaded$.next(evt)} />
