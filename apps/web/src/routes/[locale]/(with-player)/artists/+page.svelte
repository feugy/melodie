<script lang="ts">
  import { getTracksByIds, trackQueue } from '$lib/client'
  import { Artist, Heading } from '$lib/components'
  import type { LightArtist } from '$lib/types'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  let artists = $state<LightArtist[]>(data.firstArtists)
  data.artists?.then((value) => {
    artists = value
  })

  async function handlePlay(artist: LightArtist, play = true) {
    const tracks = await getTracksByIds(artist.trackIds)
    await trackQueue.add(tracks, { play })
  }
</script>

<Heading>
  {$t('_ artists', { values: { total: artists.length } })}
</Heading>

<div class="flex flex-wrap gap-x-4 p-4" data-sveltekit-preload-data="false">
  {#each artists as artist (artist.id)}
    <Artist
      agentById={data.agentById}
      {artist}
      onplay={() => handlePlay(artist)}
      onenqueue={() => handlePlay(artist, false)}
    />
  {/each}
</div>
