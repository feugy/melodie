<script lang="ts">
  import { base } from '$app/paths'
  import { getImage, trackQueue } from '$lib/client'
  import { Album, Button, Heading, Image } from '$lib/components'
  import type { Track } from '@melodie/common/models'
  import Back from 'lucide-svelte/icons/arrow-big-left-dash'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import PlayIcon from 'lucide-svelte/icons/play'
  import { locale, t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { artist, albumsWithTracks, agentById } = data

  let allTracks = $derived(
    albumsWithTracks.reduce<Track[]>(
      (all, { tracks }) => all.concat(tracks),
      []
    )
  )
</script>

<Heading>
  {artist.name}
</Heading>

<a class="mx-4 flex items-center gap-2" href="{base}/{$locale}/artists"
  ><Back />{$t('artist list')}</a
>

<div class="grid grid-rows-[auto_1fr_auto] p-4">
  <div class="flex gap-4">
    <span
      class="bg-primary-500/10 inline-block aspect-square overflow-clip rounded-full"
    >
      <Image
        alt="{artist.name}'s avatar"
        brokenIcon="user"
        height={400}
        layout="fixed"
        src={getImage(artist, agentById, 'artists')}
        width={400}
      />
    </span>
    <div class="flex flex-col gap-2">
      <div class="mb-4 flex flex-wrap items-start gap-4">
        <Button Icon={PlayIcon} onclick={() => trackQueue.add(allTracks)}>
          {$t('play all')}
        </Button>
        <Button
          Icon={EnqueueIcon}
          onclick={() => trackQueue.add(allTracks, { play: false })}
        >
          {$t('enqueue')}
        </Button>
      </div>
    </div>
  </div>
  <div class="mt-8 flex flex-row flex-wrap items-start justify-around gap-8">
    {#each albumsWithTracks as { album, year, tracks } (album.id)}
      <Album
        {agentById}
        {album}
        onplay={() => trackQueue.add(tracks)}
        onenqueue={() => trackQueue.add(tracks, { play: false })}
      >
        {#snippet details()}{year === 0 ? '' : year}{/snippet}
      </Album>
    {/each}
  </div>
</div>
