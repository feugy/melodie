<script lang="ts">
  import { trackQueue } from '$lib/client'
  import { Button, Heading, Player, TrackQueue } from '$lib/components'
  import { formatTime, sumDurations } from '$lib/utils'
  import Trash from 'lucide-svelte/icons/trash'
  import type { Snippet } from 'svelte'
  import { t } from 'svelte-intl-precompile'

  let length = $derived(trackQueue.content.length)

  let { children }: { children: Snippet } = $props()
</script>

<div class="flex h-screen flex-col overflow-hidden">
  <div class="grid flex-1 grid-cols-[1fr_30%] overflow-auto">
    <main class="overflow-auto">
      {@render children?.()}
    </main>
    <aside class="preset-filled-surface-50-950 overflow-auto">
      <Heading class="preset-tonal-surface mr-2 flex items-center gap-4">
        <span class="flex-1">{$t('_ tracks', { values: { length } })}</span>
        {#if length}
          <span class="text-base"
            >{formatTime(sumDurations(trackQueue.content))}</span
          >
          <Button Icon={Trash} onclick={trackQueue.clear.bind(trackQueue)} />
        {/if}
      </Heading>
      <TrackQueue
        tracks={trackQueue.content}
        current={trackQueue.current}
        onremove={trackQueue.removeAt.bind(trackQueue)}
        onmove={trackQueue.move.bind(trackQueue)}
        onplay={trackQueue.jumpTo.bind(trackQueue)}
      />
    </aside>
  </div>
  <footer class="bg-surface-50 p-2">
    <Player
      track={trackQueue.current}
      onnext={trackQueue.playNext.bind(trackQueue)}
      onprevious={trackQueue.playPrevious.bind(trackQueue)}
    />
  </footer>
</div>
