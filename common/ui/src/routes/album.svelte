<script context="module">
  let listLoaded = false
</script>

<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { Album, Heading } from '../components'
  import { albums, list } from '../stores/albums'

  export const params = {}

  onMount(() => {
    if (!listLoaded) {
      list()
      listLoaded = true
    }
  })
</script>

<style type="postcss">
  section {
    @apply flex flex-col items-stretch w-full overflow-hidden;
    min-height: 16rem;
  }

  div {
    @apply flex flex-wrap justify-around;
  }

  span {
    @apply p-2;
  }

  p {
    @apply my-20;
  }
</style>

<section in:fade={{ duration: 200 }}>
  <Heading
    title={$_($albums.length === 1 ? 'an album' : '_ albums', {
      total: $albums.length
    })}
    image={'../images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'}
    imagePosition="center 25%" />
  <div>
    {#each $albums as src, i (src.id)}
      <span id={i === 0 ? 'firstAlbum' : null}>
        <Album {src} />
      </span>
    {:else}
      <p>
        {@html $_('check parameters')}
      </p>
    {/each}
  </div>
</section>
