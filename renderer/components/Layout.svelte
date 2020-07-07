<script>
  import { Button } from 'smelte'
  import { _ } from 'svelte-intl'
  import Album from './Album.svelte'
  import Player from './Player.svelte'
  import TrackList from './TrackList.svelte'
  import { albums, open } from '../stores/albums'
  import trackList from '../stores/track-list'

  let currentList

  async function handleOpenAlbum($album) {
    if (currentList === $album) {
      currentList = undefined
    } else {
      if (!$album.tracks) {
        open($album)
      }
      currentList = $album
    }
  }
</script>

<div class="flex flex-col items-stretch">
  <Player
    on:openPlaylist={() => (currentList = { title: $_('playlist'), tracks: $trackList.tracks })} />
  <span>
    <h2 class="text-xl">{$_('albums')}</h2>
    <div class="flex flex-wrap justify-start">
      {#each $albums as src}
        <span class="p-4">
          <Album {src} on:click={() => handleOpenAlbum(src)} on:click on:play />
        </span>
      {/each}
    </div>
  </span>
</div>
{#if currentList}
  <aside
    class="fixed right-0 inset-y-0 shadow-lg p-4 w-1/3 bg-white flex flex-col">
    <header class="flex items-center">
      <span class="text-xl mb-2 flex-grow">{currentList.title}</span>
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
