<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Router, { replace } from 'svelte-spa-router'
  import {
    Progress,
    Player,
    Nav,
    Sheet,
    SystemNotifier,
    TracksQueue
  } from './components'
  import * as queue from './stores/track-queue'
  import { list as listArtists, artists } from './stores/artists'
  import { list as listAlbums, albums } from './stores/albums'
  import { fromServerChannel, invoke } from './utils'
  import { routes } from './routes'
  import { pluck } from 'rxjs/operators'

  let isPlaylistOpen = false
  let isLoading = fromServerChannel('tracking').pipe(pluck('inProgress'))

  onMount(async () => {
    listAlbums()
    listArtists()
    invoke('settingsManager.compareAndWatch')
    await new Promise(r => setTimeout(r, 100))
    if ($albums.length === 0 && $artists.length === 0) {
      replace('/settings')
    }
  })
</script>

<style class="postcss">
  :global(body) {
    @apply p-0 m-0;
  }

  div {
    @apply flex flex-col h-full max-h-full;
  }

  main {
    @apply flex-grow overflow-y-auto;
  }

  section {
    @apply text-center w-full overflow-auto pb-10;
  }

  aside {
    @apply overflow-y-auto h-full;
    background: var(--bg-primary-color);
  }

  footer {
    @apply p-4;
    background: var(--bg-primary-color);
    border-top: solid 1px rgba(212, 212, 255, 0.1);
  }

  .progress {
    @apply absolute inset-x-0 top-0 z-10;
  }
</style>

<svelte:options immutable={true} />

<svelte:head>
  <title>{$_('Mélodie')}</title>
</svelte:head>

<SystemNotifier />
{#if $isLoading}
  <span class="progress">
    <Progress />
  </span>
{/if}

<div>
  <main>
    <Sheet bind:open={isPlaylistOpen}>
      <section slot="main">

        <Nav />
        <Router {routes} />
      </section>
      <aside slot="aside">
        <TracksQueue />
      </aside>
    </Sheet>
  </main>
  <footer>
    <Player
      trackList={queue}
      on:togglePlaylist={() => (isPlaylistOpen = !isPlaylistOpen)} />
  </footer>
</div>
