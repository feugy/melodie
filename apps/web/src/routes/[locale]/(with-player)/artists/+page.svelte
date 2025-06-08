<script lang="ts">
  import { getTracksByIds, trackQueue } from '$lib/client'
  import { Artist, Heading } from '$lib/components'
  import type { ArtistsContext, LightArtist } from '$lib/types'
  import { getContext } from 'svelte'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const context = getContext<ArtistsContext>('artists')
  let artists = $state(context.get())
  data.artists?.then((value) => {
    artists = value
    context.set(value)
  })

  async function handlePlay(artist: LightArtist, play = true) {
    const tracks = await getTracksByIds(artist.trackIds)
    await trackQueue.add(tracks, { play, replace: play })
  }
</script>

<Heading>
  {$t('_ artists', { values: { total: data.total } })}
</Heading>

<div class="flex flex-wrap justify-around gap-4 p-4">
  {#each artists as artist (artist.id)}
    <Artist
      agentById={data.agentById}
      {artist}
      onplay={() => handlePlay(artist)}
      onenqueue={() => handlePlay(artist, false)}
    />
  {/each}
</div>
