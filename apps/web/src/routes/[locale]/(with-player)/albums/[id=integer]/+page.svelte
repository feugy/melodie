<script lang="ts">
  import { getImage, trackQueue } from '$lib/client'
  import { DisksList, Heading, Image } from '$lib/components'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { album, tracks } = data
</script>

<Heading class="preset-tonal-surface">
  {album.name}
</Heading>

<div class="grid grid-rows-[auto_1fr_auto] p-4">
  <Image
    alt="Album cover for {album.name}"
    brokenIcon="music"
    height={400}
    layout="fixed"
    src={getImage(album, data.agentById)}
    width={400}
  />
  <DisksList {tracks} hideAlbum onclick={(_, track) => trackQueue.add(track)} />
</div>
