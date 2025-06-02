<script lang="ts">
  import { getTracksByIds, trackQueue } from '$lib/client'
  import { Album, Heading } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  let albums = $state<LightAlbum[]>(data.firstAlbums)
  data.albums?.then((value) => {
    albums = value
  })

  async function handlePlay(album: LightAlbum, play = true) {
    const tracks = await getTracksByIds(album.trackIds)
    await trackQueue.add(tracks, { play })
  }
</script>

<Heading>
  {$t('_ albums', { values: { total: albums.length } })}
</Heading>

<div
  class="flex flex-wrap justify-around gap-x-4 p-4"
  data-sveltekit-preload-data="false"
>
  {#each albums as album (album.id)}
    <Album
      agentById={data.agentById}
      {album}
      onplay={() => handlePlay(album)}
      onenqueue={() => handlePlay(album, false)}
    />
  {/each}
</div>
