<script>
  import { _ } from 'svelte-intl'
  import { fade } from 'svelte/transition'
  import { Artist, Heading } from '../components'
  import { artists } from '../stores/artists'

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

  span {
    @apply p-4;
  }

  p {
    @apply my-20 relative;
  }
</style>

<section in:fade={{ duration: 200 }}>
  <Heading
    title={$_($artists.length === 1 ? 'an artist' : '_ artists', {
      total: $artists.length
    })}
    image={'../images/larisa-birta-slbOcNlWNHA-unsplash.jpg'} />
  <div>
    {#each $artists as src (src.id)}
      <span>
        <Artist {src} />
      </span>
    {:else}
      <p>
        {@html $_('check parameters')}
      </p>
    {/each}
  </div>
</section>
