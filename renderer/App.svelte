<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Router from 'svelte-spa-router'
  import { Button, Progress, Player, Nav, Sheet } from './components'
  import * as queue from './stores/track-queue'
  import { list as listAlbums } from './stores/albums'
  import { channelListener } from './utils'
  import { routes } from './routes'

  let isLoading = false
  let isPlaylistOpen = false

  onMount(() => {
    listAlbums()
    channelListener('tracking', ({ inProgress, op }) => {
      if (op === 'addFolders') {
        isLoading = inProgress
      }
    }).subscribe()
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
    @apply p-4 h-full;
    background: var(--bg-primary-color);
  }

  footer {
    @apply p-4;
    background: var(--bg-primary-color);
    border-top: solid 1px rgba(212, 212, 255, 0.1);
  }
</style>

<svelte:options immutable={true} />

<svelte:head>
  <title>{$_('Mélodie')}</title>
</svelte:head>

<div>
  <main>
    <Sheet bind:open={isPlaylistOpen}>
      <section slot="main">
        <Nav />
        {#if isLoading}
          <Progress />
        {/if}
        <Router {routes} />
      </section>
      <aside slot="aside">
        <p>Here is some content for the playlist</p>
      </aside>
    </Sheet>
  </main>
  <footer>
    <Player
      trackList={queue}
      on:togglePlaylist={() => (isPlaylistOpen = !isPlaylistOpen)} />
  </footer>
</div>
