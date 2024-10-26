<script lang="ts">
  import { Button, SortableList, Track } from '$lib/components'
  import type { Track as TrackModel } from '@melodie/common/models'
  import CloseIcon from 'lucide-svelte/icons/x'

  interface TrackQueueProps {
    current?: TrackModel
    tracks: TrackModel[]
    withClose?: boolean
    onmove: (args: { from: number; to: number }) => unknown
    onplay: (index: number) => unknown
    onremove: (index: number) => unknown
  }

  let { current, onmove, onplay, onremove, tracks }: TrackQueueProps = $props()

  let currentIdx = $derived(current ? tracks.indexOf(current) : null)
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
        class:preset-filled-tertiary-500={isCurrent}
        class:current={isCurrent}
        class="content-visibility-auto flex w-full items-center gap-2 px-2"
        onclick={() => onplay(index)}
      >
        <Track src={item} details class="flex-auto" />
        <Button
          color="secondary"
          class="mx-2"
          onclick={() => onremove(index)}
          Icon={CloseIcon}
        />
      </button>
    {/snippet}
  </SortableList>
</div>
