<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import GridItem from '../GridItem/GridItem.svelte'

  export let src
</script>

<style lang="postcss">
  h4 {
    @apply text-sm truncate w-full;
  }
</style>

<GridItem {src} kind="artist">
  <Image
    class="h-full w-full"
    src={src && src.media ? `${window.dlUrl}${src.media}` : null}
    rounded
  />
  <h4 slot="details">
    {#if src.refs.length}
      {$_(src.refs.length === 1 ? 'an album' : '_ albums', {
        total: src.refs.length
      })}
    {/if}
  </h4>
</GridItem>
