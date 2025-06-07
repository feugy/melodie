<script lang="ts">
  import { GridItem } from '$lib/components'
  import type { GridItemProps } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import { wrapWithLinks } from '$lib/utils'
  import type { Snippet } from 'svelte'
  import { t } from 'svelte-intl-precompile'

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
