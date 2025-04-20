<script lang="ts">
  import { SortableList, type SortableListProps, Track } from '$lib/components'
  import type { Agent, Track as FullTrack } from '@melodie/common/models'

  type T = Pick<FullTrack, 'id' | 'tags'>
  const agentById = new Map<number, Agent>()

  let props: Omit<SortableListProps<T>, 'item'> & {
    onclick?: (item: T, index: number) => unknown
  } = $props()
</script>

{#snippet item({ item, index }: { item: T; index: number })}
  <button
    class="w-full {index % 2
      ? 'bg-surface-300'
      : ''} flex items-center gap-2 px-2"
    onclick={() => props.onclick?.(item, index)}
  >
    <span>#{index + 1}</span><Track
      {agentById}
      src={item as FullTrack}
      details
      class="col-span-11"
    />
  </button>
{/snippet}

<SortableList {item} {...props} />
