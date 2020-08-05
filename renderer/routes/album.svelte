<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { fade } from 'svelte/transition'
  import { Album, Button, Heading } from '../components'
  import { albums, load, list } from '../stores/albums'
  import { add } from '../stores/track-queue'
  import { invoke } from '../utils'

  export const params = {}

  onMount(() => list())

  async function handleAlbumPlay({ detail: album }, immediate = true) {
    if (!album.tracks) {
      album = await load(album.id)
    }
    add(album.tracks, immediate)
  }

  async function handleAlbumEnqueue(evt) {
    return handleAlbumPlay(evt, false)
  }
</script>

<style type="postcss">
  section {
    @apply flex flex-col items-stretch w-full mb-12 overflow-hidden relative;
    min-height: 16rem;
  }

  div {
    @apply flex flex-wrap justify-around;
  }
</style>

<section transition:fade={{ duration: 200 }}>
  <Heading
    title={$_('_ albums', { total: $albums.length })}
    image={'../images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'} />
  <div>
    {#each $albums as src (src.id)}
      <a href={`#/album/${src.id}`} class="p-4">
        <Album
          {src}
          on:play={handleAlbumPlay}
          on:enqueue={handleAlbumEnqueue} />
      </a>
    {/each}
  </div>
</section>
<Button on:click={() => invoke('fileLoader.addFolders')} text={$_('load')} />
