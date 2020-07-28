<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Router from 'svelte-spa-router'
  import { Button, Progress, Player, Nav } from './components'
  import trackList from './stores/track-list'
  import { list as listAlbums } from './stores/albums'
  import { channelListener } from './utils'
  import { routes } from './routes'

  let isLoading = false

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
    @apply text-center m-0 p-0;
  }

  main {
    @apply pb-48;
  }

  .player-wrapper {
    @apply fixed bottom-0 inset-x-0 p-4;
    background: var(--bg-primary-color);
    border-top: solid 1px rgba(212, 212, 255, 0.1);
  }
</style>

<svelte:options immutable={true} />

<svelte:head>
  <title>{$_('Mélodie')}</title>
</svelte:head>

<main>
  <Nav />
  {#if isLoading}
    <Progress />
  {/if}
  <Router {routes} />
</main>
<footer class="player-wrapper">
  <Player {trackList} />
</footer>
