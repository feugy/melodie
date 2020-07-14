<script>
  import { Button } from 'smelte'
  import { _ } from 'svelte-intl'
  import Album from './Album.svelte'
  import Player from './Player.svelte'
  import TrackList from './TrackList.svelte'
  import { albums, loadTracks } from '../stores/albums'
  import trackList from '../stores/track-list'

  let currentList

  async function handleOpenAlbum(album) {
    if (currentList === album) {
      currentList = undefined
    } else {
      currentList = album
      if (!album.tracks) {
        await loadTracks(album)
      }
      currentList = $albums.find(({ id }) => id === album.id)
    }
  }
</script>

<style>
  .mainWithAside {
    width: 66%;
  }
</style>

<main
  class="flex flex-col items-stretch w-full mb-12"
  class:mainWithAside={!!currentList}>
  <span>
    <h2 class="text-xl">{$_('albums')}</h2>
    <div class="flex flex-wrap justify-between">
      {#each $albums as src (src.id)}
        <span class="p-4">
          <Album {src} on:click={() => handleOpenAlbum(src)} on:click on:play />
        </span>
      {/each}
    </div>
  </span>
</main>
{#if currentList}
  <aside
    class="fixed inset-y-0 right-0 shadow-lg p-4 w-1/3 bg-white flex flex-col
    pb-24">
    <header class="flex items-center">
      <span class="text-xl mb-2 flex-grow">{currentList.name}</span>
      <Button
        on:click={() => (currentList = undefined)}
        text
        light
        flat
        icon="close" />
    </header>
    <TrackList on:select items={currentList.tracks} />
  </aside>
{/if}
<div class="fixed bottom-0 inset-x-0 bg-white p-4 border-t">
  <Player
    on:openPlaylist={() => (currentList = { name: $_('playlist'), tracks: $trackList.tracks })} />
</div>
