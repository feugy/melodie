<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { Heading, Playlist } from '../components'
  import { playlists, list } from '../stores/playlists'

  export const params = {}

  onMount(() => {
    if ($playlists.length === 0) {
      list()
    }
  })
</script>

<style type="postcss">
  section {
    @apply flex flex-col items-stretch w-full mb-12 overflow-hidden;
    min-height: 16rem;
  }

  div {
    @apply flex flex-wrap justify-around z-0;
  }

  span {
    @apply p-4;
  }

  p {
    @apply my-20;
  }
</style>

<section in:fade={{ duration: 200 }}>
  <Heading
    title={$_($playlists.length === 1 ? 'a playlist' : '_ playlists', {
      total: $playlists.length
    })}
    image={'../images/david-villasana-YNJGB-_Vlgw-unsplash.jpg'}
    imagePosition="center 46%" />
  <div>
    {#each $playlists as src (src.id)}
      <span>
        <Playlist {src} />
      </span>
    {:else}
      <p>
        {@html $_('how to create playlist')}
      </p>
    {/each}
  </div>
</section>
