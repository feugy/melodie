<script>
  import { _ } from 'svelte-intl'

  import GridItem from '../GridItem/GridItem.svelte'
  import Image from '../Image/Image.svelte'

  export let src
</script>

<GridItem {src} kind="artist">
  <Image class="h-full w-full" src={src?.media} rounded />
  <h4 slot="details">
    {#if src.refs.length}
      {$_(src.refs.length === 1 ? 'an album' : '_ albums', {
        total: src.refs.length
      })}
    {/if}
  </h4>
</GridItem>

<style>
  h4 {
    --at-apply: text-sm truncate w-full;
  }
</style>
