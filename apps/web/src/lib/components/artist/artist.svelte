<script lang="ts">
  import { GridItem } from '$lib/components'
  import type { GridItemProps } from '$lib/components'
  import type { LightArtist } from '$lib/types'
  import { t } from 'svelte-intl-precompile'

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
