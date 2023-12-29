<script>
  import { _ } from 'svelte-intl'

  import { wrapWithLinks } from '../../utils'
  import GridItem from '../GridItem/GridItem.svelte'
  import Image from '../Image/Image.svelte'

  export let src
</script>

<GridItem {src} kind="album">
  <Image class="h-full w-full" src={src?.media} />
  <h4 slot="details">
    {#if src.refs.length}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html $_('by _', {
        artist: wrapWithLinks('artist', src.refs).join(', ')
      })}
    {/if}
    <slot />
  </h4>
</GridItem>

<style>
  h4 {
    --at-apply: text-sm truncate w-full;
  }
</style>
