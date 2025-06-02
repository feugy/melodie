<script lang="ts">
  import { LG, MD, screen, trackQueue } from '$lib/client'
  import {
    Button,
    Heading,
    Nav,
    Player,
    Sticky,
    SystemNotifier,
    TrackQueue,
  } from '$lib/components'
  import { formatTime, sumDurations } from '$lib/utils'
  import TrackListIcon from 'lucide-svelte/icons/undo-2'
  import TrashIcon from 'lucide-svelte/icons/trash'
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
  let trackListOpen = $state(false)

  onMount(() => {
    return trackQueue.registerAutoNextListener(() =>
      notifier.notify(trackQueue.current)
    )
  })
</script>

<div class="flex h-screen flex-col overflow-hidden">
  <div
    class={[
      'grid flex-1 overflow-auto',
      screen.size < LG
        ? trackListOpen
          ? 'grid-cols-[0_1fr]'
          : 'grid-cols-[1fr_fit-content(400px)]'
        : 'grid-cols-[1fr_fit-content(40%)]',
    ]}
  >
    <main class="overflow-auto">
      <Nav bind:trackListOpen />
      {@render children?.()}
    </main>
    <aside
      class={[
        'preset-filled-primary-800-200 overflow-auto',
        screen.size < MD && !trackListOpen && 'w-0',
      ]}
    >
      <Sticky class="flex items-center gap-2 p-2">
        {#if trackListOpen}
          <Button
            Icon={TrackListIcon}
            onclick={() => (trackListOpen = false)}
          />
        {/if}
        {#await data.trackQueueLoading}
          chargement...
        {:then}
          <span class="flex-1"
            >{$t('track _/_', {
              values: {
                index: (trackQueue.index ?? -1) + 1,
                length: trackQueue.length,
              },
            })}</span
          >
          {#if trackQueue.length}
            <div class="pr-2">
              <span class="pr-4 text-base"
                >{formatTime(sumDurations(trackQueue.content))}</span
              >
              <Button
                Icon={TrashIcon}
                onclick={trackQueue.clear.bind(trackQueue)}
              />
            </div>
          {/if}
        {/await}
      </Sticky>
      <Heading class="mt-10! mr-2 flex items-center gap-4">
        {$t('track queue')}
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
