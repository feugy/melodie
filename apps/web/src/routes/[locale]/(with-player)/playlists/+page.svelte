<script lang="ts">
  import { getTracksByIds, trackQueue } from '$lib/client'
  import { Heading, Playlist } from '$lib/components'
  import type { LightPlaylist, PlaylistsContext } from '$lib/types'
  import { getContext } from 'svelte'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const context = getContext<PlaylistsContext>('playlists')
  let playlists = $state(context.get())
  data.playlists?.then((value) => {
    playlists = value
    context.set(value)
  })

  async function handlePlay(playlist: LightPlaylist, play = true) {
    const tracks = await getTracksByIds(playlist.trackIds)
    await trackQueue.add(tracks, { play, replace: play })
  }
</script>

<Heading>
  {$t('_ playlists', { values: { total: data.total } })}
</Heading>

<div class="flex flex-wrap justify-around gap-4 p-4">
  {#each playlists as playlist (playlist.id)}
    <Playlist
      agentById={data.agentById}
      {playlist}
      onplay={() => handlePlay(playlist)}
      onenqueue={() => handlePlay(playlist, false)}
    />
  {/each}
</div>
