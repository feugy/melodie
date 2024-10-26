<script context="module">
  let listLoaded = false
</script>

<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'

  import { Artist, Heading } from '../components'
  import { artists, list } from '../stores/artists'

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
    title={$_($artists.length === 1 ? 'an artist' : '_ artists', {
      total: $artists.length
    })}
    image={'../images/larisa-birta-slbOcNlWNHA-unsplash.jpg'}
  />
  <div>
    {#each $artists as src (src.id)}
      <span>
        <Artist {src} />
      </span>
    {:else}
      <p>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html $_('check parameters')}
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
    --at-apply: flex flex-wrap justify-around;
  }

  span {
    --at-apply: p-2;
  }

  p {
    --at-apply: my-20;
  }
</style>
