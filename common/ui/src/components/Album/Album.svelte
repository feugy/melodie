<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import GridItem from '../GridItem/GridItem.svelte'
  import { wrapWithLinks } from '../../utils'

  export let src
</script>

<style type="postcss">
  h4 {
    @apply text-sm truncate w-full;
  }
</style>

<GridItem {src} kind="album">
  <Image
    class="h-full w-full"
    src={src && src.media ? `${window.dlUrl}${src.media}` : null}
  />
  <h4 slot="details">
    {#if src.refs.length}
      {@html $_('by _', {
        artist: wrapWithLinks('artist', src.refs).join(', ')
      })}
    {/if}
    <slot />
  </h4>
</GridItem>
