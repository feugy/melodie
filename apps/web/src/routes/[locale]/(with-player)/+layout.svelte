<script lang="ts">
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { LG, MD, screen, trackQueue } from '$lib/client'
  import {
    Button,
    Heading,
    Nav,
    Player,
    Sticky,
    SystemNotifier,
    TrackLoader,
    TrackQueue,
  } from '$lib/components'
  import type { ScrollContext } from '$lib/types'
  import { debounce, formatTime, initContext, sumDurations } from '$lib/utils'
  import TrashIcon from 'lucide-svelte/icons/trash'
  import TrackListIcon from 'lucide-svelte/icons/undo-2'
  import { type Snippet, getContext, onMount } from 'svelte'
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
  let main: HTMLElement | null = null

  initContext()
  const scrollContext = getContext<ScrollContext>('scroll')()

  onMount(() => {
    return trackQueue.registerAutoNextListener(() =>
      notifier.notify(trackQueue.current)
    )
  })

  afterNavigate(() => {
    const position = scrollContext.get(page.url.pathname)
    if (main) {
      main.scrollTop = position ?? 0
    }
  })

  const recordScrollPosition = debounce((position: number) => {
    scrollContext.set(page.url.pathname, position)
  }, 100)

  function handleScroll(event: Event) {
    recordScrollPosition((event.target as HTMLElement).scrollTop)
  }

  function handleClearQueue() {
    trackQueue.clear()
    trackListOpen = false
  }
</script>

<div class="flex h-screen flex-col overflow-hidden">
  <div
    class={[
      'grid flex-1 overflow-auto',
      screen.size < LG
        ? trackListOpen
          ? 'grid-cols-[0_1fr]'
          : 'grid-cols-[1fr_fit-content(400px)]'
        : 'grid-cols-[1fr_fit-content(40vw)]',
    ]}
  >
    <main bind:this={main} class="overflow-auto" onscroll={handleScroll}>
      <Nav bind:trackListOpen />
      {@render children?.()}
    </main>
    <aside
      class={[
        'preset-filled-primary-800-200 overflow-auto',
        screen.size < MD && !trackListOpen && 'w-0',
        screen.size >= MD && 'w-[40vw]',
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
              <Button Icon={TrashIcon} onclick={handleClearQueue} />
            </div>
          {/if}
        {/await}
      </Sticky>
      <Heading class="mt-12! mr-2 flex items-center gap-4">
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
    <TrackLoader
      agentById={data.agentById}
      tracks={trackQueue.content}
      currentIdx={trackQueue.index}
    />
  </footer>
</div>
