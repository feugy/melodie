<script context="module">
  let listLoaded = false
</script>

<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { Heading, Playlist } from '../components'
  import { playlists, list } from '../stores/playlists'

  export const params = {}

  onMount(() => {
    if (!listLoaded) {
      list()
      listLoaded = true
    }
  })
</script>

<style lang="postcss">
  section {
    @apply flex flex-col items-stretch w-full overflow-hidden;
    min-height: 16rem;
  }

  div {
    @apply flex flex-wrap justify-around z-0;
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
    title={$_($playlists.length === 1 ? 'a playlist' : '_ playlists', {
      total: $playlists.length
    })}
    image={'../images/david-villasana-YNJGB-_Vlgw-unsplash.jpg'}
    imagePosition="center 46%"
  />
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
