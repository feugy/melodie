<script lang="ts">
  import type { LightAlbum } from '$lib/types'
  import { wrapWithLinks } from '$lib/utils'
  import type { Snippet } from 'svelte'
  import { t } from 'svelte-intl-precompile'
  import GridItem  from '../grid-item/grid-item.svelte'
  import type { GridItemProps } from '../grid-item/grid-item.svelte'

  let {
    album,
    details: albumDetails,
    ...props
  }: GridItemProps & {
    album: LightAlbum
    details?: Snippet
  } = $props()
</script>

<GridItem src={album} kind="albums" detailsHeight={62} {...props}>
  {#snippet details()}
    {#if album.refs.length}
      <div class="truncate text-xs">
        {@html $t('by _', {
          values: {
            artists: wrapWithLinks('artists', album.refs).join(', '),
          },
        })}
      </div>
    {/if}
    {@render albumDetails?.()}
  {/snippet}
</GridItem>
