<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { fade } from 'svelte/transition'
  import { push } from 'svelte-spa-router'
  import { Artist, Heading } from '../components'
  import { artists, load, list } from '../stores/artists'
  import { add } from '../stores/track-queue'
  import { invoke } from '../utils'

  export const params = {}

  onMount(() => list())

  async function handlePlay({ detail: album }, immediate = true) {
    if (!album.tracks) {
      album = await load(album.id)
    }
    add(album.tracks, immediate)
  }

  async function handleEnqueue(evt) {
    return handlePlay(evt, false)
  }

  function handleSelect({ detail: { id } }) {
    push(`/artist/${id}`)
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
    title={$_('_ artists', { total: $artists.length })}
    image={'../images/larisa-birta-slbOcNlWNHA-unsplash.jpg'} />
  <div>
    {#each $artists as src (src.id)}
      <span class="p-4">
        <Artist
          {src}
          on:play={handlePlay}
          on:enqueue={handleEnqueue}
          on:select={handleSelect} />
      </span>
    {/each}
  </div>
</section>
