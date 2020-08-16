<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { fade } from 'svelte/transition'
  import { Album, Button, Heading } from '../components'
  import { albums } from '../stores/albums'
  import { invoke } from '../utils'

  export const params = {}
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
    title={$_($albums.length === 1 ? 'an album' : '_ albums', {
      total: $albums.length
    })}
    image={'../images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'}
    imagePosition="center 25%" />
  <div>
    {#each $albums as src (src.id)}
      <span class="p-4">
        <Album {src} />
      </span>
    {/each}
  </div>
</section>
<Button on:click={() => invoke('fileLoader.addFolders')} text={$_('load')} />
