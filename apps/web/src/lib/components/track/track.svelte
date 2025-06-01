<script module lang="ts">
  import { getImage } from '$lib/client'
  import { Image } from '$lib/components'
  import { formatTime, linkTo, wrapWithLinks } from '$lib/utils'
  import type { Agent, Track } from '@melodie/common/models'
  import type { Tags } from '@melodie/common/types'

  export interface TrackProps {
    agentById: Map<number, Agent>
    src?: Track
    details?: boolean
    class?: string
    withLinks?: boolean
  }
</script>

<script lang="ts">
  let {
    agentById,
    src,
    details = false,
    class: className = '',
    withLinks = true,
  }: TrackProps = $props()

  let tags: Partial<Tags> = $derived(src?.tags ?? {})

  let cover = $derived(getImage(src, agentById))
</script>

<div
  class={`${className} md:min-w-200px m-2 flex w-full flex-row items-center`}
>
  {#if withLinks}
    <a class="w-16 flex-none" href={linkTo('albums', src?.albumRef)}>
      <Image class="actionable text-xs" height={64} src={cover} width={64} />
    </a>
  {:else}
    <Image class="text-xs" height={64} src={cover} width={64} />
  {/if}
  <div class="flex flex-grow flex-col items-start justify-start px-2 text-left">
    <span class="text-lg">{tags.title}</span>
    <span
      >{#if withLinks}
        {@html wrapWithLinks('artists', src?.artistRefs, 'text-sm').join(', ')}
      {:else}
        {(src?.artistRefs ?? []).map(([, artist]) => artist).join(', ')}
      {/if}
    </span>
  </div>
  {#if details}
    <div class="text-lg">{formatTime(tags.duration)}</div>
  {/if}
</div>
