<script lang="ts">
  import { MD, getImage, localLibrary, screen, trackQueue } from '$lib/client'
  import { Button, DisksList, Heading, Image, TrackCount } from '$lib/components'
  import { wrapWithLinks } from '$lib/utils'
  import DownloadIcon from '@lucide/svelte/icons/download'
  import EnqueueIcon from '@lucide/svelte/icons/list-plus'
  import PlayIcon from '@lucide/svelte/icons/play'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { album, tracks } = data

  type DownloadState = 'idle' | 'downloading' | 'saved'
  let downloadState = $state<DownloadState>('idle')
  let downloadDone = $state(0)

  async function saveToDevice() {
    if (downloadState !== 'idle') return
    downloadState = 'downloading'
    downloadDone = 0
    try {
      for await (const { done } of localLibrary.saveToDevice(tracks)) {
        downloadDone = done
      }
      downloadState = 'saved'
      setTimeout(() => {
        downloadState = 'idle'
      }, 3000)
    } catch {
      downloadState = 'idle'
    }
  }
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
        {#if localLibrary.supported}
          <Button
            Icon={downloadState === 'idle' || downloadState === 'saved'
              ? DownloadIcon
              : undefined}
            loading={downloadState === 'downloading'}
            onclick={saveToDevice}
          >
            {#if downloadState === 'downloading'}
              {$t('downloading _ of _', {
                values: { done: downloadDone, total: tracks.length },
              })}
            {:else if downloadState === 'saved'}
              {$t('saved')}
            {:else}
              {$t('save to device')}
            {/if}
          </Button>
        {/if}
      </div>
      <TrackCount {tracks} />
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
