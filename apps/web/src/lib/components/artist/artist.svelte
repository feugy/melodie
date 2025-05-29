<script lang="ts">
  import { GridItem } from '$lib/components'
  import type { GridItemProps } from '$lib/components'
  import type { LightArtist } from '$lib/types'

  let {
    artist,
    ...props
  }: GridItemProps & {
    artist: LightArtist
  } = $props()
</script>

<GridItem src={artist} kind="artist" {...props} />
