<script lang="ts">
  import type { LightArtist } from '$lib/types'
  import { t } from 'svelte-intl-precompile'
  import GridItem  from '../grid-item/grid-item.svelte'
  import type { GridItemProps } from '../grid-item/grid-item.svelte'

  let {
    artist,
    ...props
  }: GridItemProps & {
    artist: LightArtist
  } = $props()
</script>

<GridItem src={artist} kind="artists" detailsHeight={62} {...props}>
  {#snippet details()}
    <div class="text-xs">
      {$t('_ albums', {
        values: { total: artist.refs.length },
      })}
    </div>
  {/snippet}
</GridItem>
