<script lang="ts">
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import {
    LG,
    MD,
    screen,
    startAuthRefresh,
    stopAuthRefresh,
    trackCache,
    trackQueue,
  } from '$lib/client'
  import {
    AddToPlaylist,
    Button,
    Heading,
    Nav,
    Player,
    Sticky,
    SystemNotifier,
    TrackQueue,
  } from '$lib/components'
  import type { ScrollContext } from '$lib/types'
  import { debounce, formatTime, initContext, sumDurations } from '$lib/utils'
  import TrashIcon from 'lucide-svelte/icons/trash'
  import { type Snippet, getContext, onMount } from 'svelte'
  import { t } from 'svelte-intl-precompile'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: Snippet } = $props()

  const onnext = trackQueue.playNext.bind(trackQueue)
  const onprevious = trackQueue.playPrevious.bind(trackQueue)
  const onremove = trackQueue.removeAt.bind(trackQueue)
  const onmove = trackQueue.move.bind(trackQueue)
  const onplay = trackQueue.jumpTo.bind(trackQueue)
  const onshuffle = trackQueue.shuffle.bind(trackQueue)
  const queueTrackIds = $derived(trackQueue.content.map((track) => track.id))

  let notifier: SystemNotifier
  let trackListOpen = $state(screen.size >= LG)
  let main: HTMLElement | null = null

  initContext()
  const scrollContext = getContext<ScrollContext>('scroll')()

  onMount(() => {
    trackCache.setAgentById(data.agentById)
    const unregisterAutoNext = trackQueue.registerAutoNextListener(() =>
      notifier.notify(trackQueue.current)
    )
    startAuthRefresh()
    return () => {
      unregisterAutoNext()
      stopAuthRefresh()
    }
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

  function onplaylistopen(value: boolean) {
    trackListOpen = value
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
      <Nav />
      {@render children?.()}
    </main>
    <aside
      class={[
        'preset-filled-primary-800-200 overflow-auto',
        screen.size < MD ? (trackListOpen ? 'w-full' : 'w-0'): (trackListOpen ? 'w-[40vw]' : 'w-0'),
      ]}
    >
      <Sticky>
        {#snippet children(floating)}
          <span
            class="{floating
              ? 'text-primary-500'
              : 'text-primary-contrast-500'} flex items-center gap-2 p-2 pr-4"
          >
            {#await data.trackQueueLoading}
              chargement...
            {:then}
              <span class="flex flex-1 items-center gap-2"
                ><span
                  >{$t('track _/_', {
                    values: {
                      index: (trackQueue.index ?? -1) + 1,
                      length: trackQueue.length,
                    },
                  })}</span
                >
                {#if trackQueue.length}
                  <AddToPlaylist trackIds={queueTrackIds} />
                {/if}
              </span>
              {#if trackQueue.length}
                <span class="pr-4 text-base"
                  >{formatTime(sumDurations(trackQueue.content))}</span
                >
                <Button Icon={TrashIcon} onclick={handleClearQueue} size="sm" />
              {/if}
            {/await}
          </span>
        {/snippet}
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
  <footer class="bg-primary-950 p-2">
    <SystemNotifier
      agentById={data.agentById}
      track={trackQueue.current}
      {onnext}
      {onprevious}
      bind:this={notifier}
    />
    <Player
      agentById={data.agentById}
      isLast={trackQueue.isLast}
      track={trackQueue.current}
      nextTrack={trackQueue.nextTrack}
      isShuffled={trackQueue.shuffled}
      isTrackListOpen={trackListOpen}
      {onnext}
      {onprevious}
      {onshuffle}
      {onplaylistopen}
    />
  </footer>
</div>
