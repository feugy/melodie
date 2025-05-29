<script lang="ts">
  import { GridItem } from '$lib/components'
  import type { GridItemProps } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import { t } from 'svelte-intl-precompile'

  let {
    album,
    ...props
  }: GridItemProps & {
    album: LightAlbum
  } = $props()
</script>

<GridItem src={album} kind="album" {...props}>
  {#snippet refs()}
    {#if album.refs.length}
      <div class="truncate text-xs">
        {$t('by _', {
          values: {
            artists: album.refs.map(([, artist]) => artist).join(', '),
          },
        })}
      </div>
    {/if}
  {/snippet}
</GridItem>
