<script>
  import { _ } from 'svelte-intl'
  import GridItem from '../GridItem/GridItem.svelte'

  export let src
</script>

<style type="postcss">
  span {
    @apply inline-block w-full h-full rounded-sm border-2 border-solid p-4 text-left;
    border-color: var(--outline-color);
    background-color: var(--hover-bg-color);
  }

  h4 {
    @apply text-sm;
  }
</style>

<GridItem {src} kind="playlist" overlay>
  <span />
  <h4 slot="details">
    {$_(src.trackIds.length === 1 ? 'a track' : '_ tracks', {
      total: src.trackIds.length
    })}
  </h4>
</GridItem>
