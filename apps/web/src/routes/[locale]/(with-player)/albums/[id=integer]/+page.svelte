<script lang="ts">
  import { getImage, trackQueue } from '$lib/client'
  import { Button, DisksList, Heading, Image } from '$lib/components'
  import { wrapWithLinks } from '$lib/utils'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import PlayIcon from 'lucide-svelte/icons/play'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { album, tracks } = data
</script>

<Heading>
  {album.name}
</Heading>

<div class="grid grid-rows-[auto_1fr_auto] p-4">
  <div class="flex gap-4">
    <span class="bg-primary-500/10 inline-block aspect-square overflow-clip">
      <Image
        alt="Album cover for {album.name}"
        brokenIcon="music"
        height={400}
        layout="fixed"
        src={getImage(album, data.agentById, 'albums')}
        width={400}
      />
    </span>
    <div class="flex flex-col gap-4">
      <div class="mb-4 flex flex-wrap items-start gap-4">
        <Button Icon={PlayIcon} onclick={() => trackQueue.add(tracks)}>
          {$t('play all')}
        </Button>
        <Button
          Icon={EnqueueIcon}
          onclick={() => trackQueue.add(tracks, { play: false })}
        >
          {$t('enqueue')}
        </Button>
      </div>
      <h3 class="mb-2 text-2xl">
        {@html $t('by _', {
          values: { artist: wrapWithLinks('artists', album.refs).join(', ') },
        })}
      </h3>
    </div>
  </div>
  <DisksList
    {tracks}
    hideAlbum
    onclick={(_, track) => trackQueue.add([track], { play: false })}
  />
</div>
