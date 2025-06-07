<script lang="ts">
  import { MD, getImage, screen, trackQueue } from '$lib/client'
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

<div class="p-4">
  <div class="flex flex-col gap-4 md:flex-row">
    <span class="bg-primary-500/10 inline-block aspect-square overflow-clip">
      <Image
        alt="Album cover for {album.name}"
        brokenIcon="music"
        layout={screen.size > MD ? 'fixed' : 'constrained'}
        src={getImage(album, data.agentById, 'albums')}
        width={screen.size <= MD ? undefined : 400}
      />
    </span>
    <div class="flex flex-col gap-4">
      <div class="mb-4 flex flex-wrap items-start gap-4">
        <Button
          Icon={PlayIcon}
          onclick={() => trackQueue.add(tracks, { replace: true })}
        >
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
