<script lang="ts">
  import type { LightPlaylist } from '$lib/types'
  import { t } from 'svelte-intl-precompile'
  import GridItem  from '../grid-item/grid-item.svelte'
  import type { GridItemProps } from '../grid-item/grid-item.svelte'

  let {
    playlist,
    ...props
  }: GridItemProps & {
    playlist: LightPlaylist
  } = $props()
</script>

<GridItem src={playlist} kind="playlists" {...props}>
  {#snippet details()}
    <div class="text-sm font-medium">
      {$t('_ tracks', { values: { total: playlist.trackIds.length } })}
    </div>
  {/snippet}
</GridItem>
