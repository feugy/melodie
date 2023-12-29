<script context="module">
  let listLoaded = false
</script>

<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'

  import { Heading, Playlist } from '../components'
  import { list, playlists } from '../stores/playlists'

  export const params = {}

  onMount(() => {
    if (!listLoaded) {
      list()
      listLoaded = true
    }
  })
</script>

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
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html $_('how to create playlist')}
      </p>
    {/each}
  </div>
</section>

<style>
  section {
    --at-apply: flex flex-col items-stretch w-full overflow-hidden;
    min-height: 16rem;
  }

  div {
    --at-apply: flex flex-wrap justify-around z-0;
  }

  span {
    --at-apply: p-2;
  }

  p {
    --at-apply: my-20;
  }
</style>
