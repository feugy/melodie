<script>
  import { _ } from 'svelte-intl'
  import GridItem from '../GridItem/GridItem.svelte'

  export let src
</script>

<GridItem {src} kind="playlist" overlay>
  <h4 slot="details">
    {$_(src.trackIds.length === 1 ? 'a track' : '_ tracks', {
      total: src.trackIds.length
    })}
  </h4>
</GridItem>
