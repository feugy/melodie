<script lang="ts">
  import { trackQueue } from '$lib/client'
  import {
    Button,
    Heading,
    Player,
    SystemNotifier,
    TrackQueue,
  } from '$lib/components'
  import { formatTime, sumDurations } from '$lib/utils'
  import Trash from 'lucide-svelte/icons/trash'
  import { type Snippet, onMount } from 'svelte'
  import { t } from 'svelte-intl-precompile'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: Snippet } = $props()

  const onnext = trackQueue.playNext.bind(trackQueue)
  const onprevious = trackQueue.playPrevious.bind(trackQueue)
  const onremove = trackQueue.removeAt.bind(trackQueue)
  const onmove = trackQueue.move.bind(trackQueue)
  const onplay = trackQueue.jumpTo.bind(trackQueue)

  let notifier: SystemNotifier

  onMount(() => {
    return trackQueue.registerAutoNextListener(() =>
      notifier.notify(trackQueue.current)
    )
  })
</script>

<div class="flex h-screen flex-col overflow-hidden">
  <div class="grid flex-1 grid-cols-[minmax(50%,1fr)_max(570px)] overflow-auto">
    <main class="text-primary-contrast-500 overflow-auto">
      {@render children?.()}
    </main>
    <aside class="preset-filled-primary-800-200 overflow-auto">
      <Heading class="mr-2 flex items-center gap-4">
        {#await data.trackQueueLoading}
          chargement...
        {:then}
          <span class="flex-1"
            >{$t('_ tracks', { values: { length: trackQueue.length } })}</span
          >
          {#if trackQueue.length}
            <span class="text-base"
              >{formatTime(sumDurations(trackQueue.content))}</span
            >
            <Button Icon={Trash} onclick={trackQueue.clear.bind(trackQueue)} />
          {/if}
        {/await}
      </Heading>
      <TrackQueue
        agentById={data.agentById}
        tracks={trackQueue.content}
        currentIdx={trackQueue.index}
        {onremove}
        {onmove}
        {onplay}
      />
    </aside>
  </div>
  <footer class="preset-filled border-primary-contrast border-t-2 p-2">
    <SystemNotifier
      agentById={data.agentById}
      track={trackQueue.current}
      {onnext}
      {onprevious}
      bind:this={notifier}
    />
    <Player
      agentById={data.agentById}
      track={trackQueue.current}
      isLast={trackQueue.isLast}
      {onnext}
      {onprevious}
    />
  </footer>
</div>
