<script lang="ts">
  import { Button, SortableList, Track } from '$lib/components'
  import type { Agent, Track as TrackModel } from '@melodie/common/models'
  import CloseIcon from 'lucide-svelte/icons/x'

  interface TrackQueueProps {
    agentById: Map<number, Agent>
    currentIdx: number | null
    tracks: TrackModel[]
    onmove: (args: { from: number; to: number }) => unknown
    onplay: (index: number) => unknown
    onremove: (index: number) => unknown
  }

  let {
    agentById,
    currentIdx,
    onmove,
    onplay,
    onremove,
    tracks,
  }: TrackQueueProps = $props()

  let list: HTMLDivElement | undefined

  $effect(() => {
    if (currentIdx !== null) {
      const item = list?.querySelector('.current')
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
</script>

<div bind:this={list}>
  <SortableList items={tracks} {onmove}>
    {#snippet item({ item, index }: { item: TrackModel; index: number })}
      {@const isCurrent = index === currentIdx}
      <button
        class:preset-filled-secondary-300-700={isCurrent}
        class:current={isCurrent}
        class="content-visibility-auto flex w-full items-center gap-2 px-2"
        onclick={() => onplay(index)}
      >
        <Track
          {agentById}
          src={item}
          details
          class="flex-auto"
          withLinks={false}
        />
        <Button
          color="secondary"
          class="mx-2"
          data-testid="remove-track-{index}"
          onclick={(evt) => {
            evt.stopPropagation()
            onremove(index)
          }}
          Icon={CloseIcon}
        />
      </button>
    {/snippet}
  </SortableList>
</div>
