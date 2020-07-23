<script>
  import { _ } from 'svelte-intl'
  import { Album, Button, Player } from '.'
  import TrackList from './TrackList.svelte'
  import { albums, loadTracks } from '../stores/albums'
  import trackList from '../stores/track-list'

  let currentList

  /* async function handleOpenAlbum(album) {
    if (currentList === album) {
      currentList = undefined
    } else {
      currentList = album
      if (!album.tracks) {
        await loadTracks(album)
      }
      currentList = $albums.find(({ id }) => id === album.id)
    }
  } */
  async function handlePlay({ detail: album }) {
    trackList.clear()
    if (!album.tracks) {
      await loadTracks(album)
    }
    trackList.add($albums.find(({ id }) => id === album.id).tracks)
  }
</script>

<style type="postcss">
  .mainWithAside {
    width: 66%;
    background: var(--dark-grey);
  }

  .player-wrapper {
    background: var(--dark-grey);
  }
</style>

<main
  class="flex flex-col items-stretch w-full mb-12"
  class:mainWithAside={!!currentList}>
  <span>
    <h2 class="text-xl">{$_('_ albums', { total: $albums.length })}</h2>
    <div class="flex flex-wrap justify-between">
      {#each $albums as src (src.id)}
        <span class="p-4">
          <Album {src} on:play={handlePlay} />
        </span>
      {/each}
    </div>
  </span>
</main>
<!--
{#if currentList}
  <aside
    class="fixed inset-y-0 right-0 shadow-lg p-4 w-1/3 flex flex-col pb-24">
    <header class="flex items-center">
      <span class="text-xl mb-2 flex-grow">{currentList.name}</span>
      <Button on:click={() => (currentList = undefined)} icon="close" />
    </header>
    <TrackList on:select items={currentList.tracks} />
  </aside>
{/if}
-->
<div class="player-wrapper fixed bottom-0 inset-x-0 p-4 border-t">
  <Player {trackList} />
</div>
