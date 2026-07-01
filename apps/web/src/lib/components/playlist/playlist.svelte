<script lang="ts">
  import { GridItem } from '$lib/components'
  import type { GridItemProps } from '$lib/components'
  import type { LightPlaylist } from '$lib/types'
  import { t } from 'svelte-intl-precompile'

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
