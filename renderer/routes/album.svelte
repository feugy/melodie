<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { Album, Heading, Tutorial } from '../components'
  import { albums, list } from '../stores/albums'
  import { isEnabled, currentStep } from '../stores/tutorial'

  export let params = {} // eslint-disable-line

  onMount(() => {
    if ($albums.length === 0) {
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
    @apply flex flex-wrap justify-around;
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

{#if $isEnabled}
  <Tutorial {...$currentStep}>
    {@html $_($currentStep.messageKey)}
  </Tutorial>
{/if}
