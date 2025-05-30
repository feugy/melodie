<script lang="ts">
  import { GridItem } from '$lib/components'
  import type { GridItemProps } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import { wrapWithLinks } from '$lib/utils'
  import { t } from 'svelte-intl-precompile'

  let {
    album,
    ...props
  }: GridItemProps & {
    album: LightAlbum
  } = $props()
</script>

<GridItem src={album} kind="albums" {...props}>
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
  {/snippet}
</GridItem>
