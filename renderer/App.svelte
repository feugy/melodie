<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Button, Progress, Player } from './components'
  import trackList from './stores/track-list'
  import { list as listAlbums } from './stores/albums'
  import { channelListener, invoke } from './utils'
  import Layout from './components/Layout.svelte'

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
  {#if isLoading}
    <Progress />
  {/if}
  <Layout />
  <Button on:click={() => invoke('fileLoader.addFolders')} text={$_('load')} />
</main>
<footer class="player-wrapper">
  <Player {trackList} />
</footer>
