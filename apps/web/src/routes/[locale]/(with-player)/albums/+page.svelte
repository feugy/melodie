<script lang="ts">
  import { getTracksByIds, trackQueue } from '$lib/client'
  import { Album, Heading } from '$lib/components'
  import type { AlbumsContext, LightAlbum } from '$lib/types'
  import { getContext } from 'svelte'
  import { _, t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const context = getContext<AlbumsContext>('albums')
  let albums = $state(context.get())
  data.albums?.then((value) => {
    albums = value
    context.set(value)
  })

  async function handlePlay(album: LightAlbum, play = true) {
    const tracks = await getTracksByIds(album.trackIds)
    await trackQueue.add(tracks, { play, replace: !play })
  }
</script>

<Heading>
  {$t('_ albums', { values: { total: data.total } })}
</Heading>

<div class="flex flex-wrap justify-around gap-4 p-4">
  {#each albums as album (album.id)}
    <Album
      agentById={data.agentById}
      {album}
      onplay={() => handlePlay(album)}
      onenqueue={() => handlePlay(album, false)}
    />
  {/each}
</div>
