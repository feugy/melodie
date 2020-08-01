<script>
  import { _ } from 'svelte-intl'
  import { fade } from 'svelte/transition'
  import { push } from 'svelte-spa-router'
  import { Album, Button, Player, Heading } from '../components'
  import { albums, load } from '../stores/albums'
  import { add } from '../stores/track-queue'
  import { invoke } from '../utils'

  export const params = {}

  async function handleAlbumPlay({ detail: album }, immediate = true) {
    if (!album.tracks) {
      album = await load(album.id)
    }
    add(album.tracks, immediate)
  }

  async function handleAlbumEnqueue(evt) {
    return handleAlbumPlay(evt, false)
  }

  function handleAlbumClick({ detail: album }) {
    push(`/album/${album.id}`)
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
      <span class="p-4">
        <Album
          {src}
          on:play={handleAlbumPlay}
          on:enqueue={handleAlbumEnqueue}
          on:select={handleAlbumClick} />
      </span>
    {/each}
  </div>
</section>
<Button on:click={() => invoke('fileLoader.addFolders')} text={$_('load')} />
