<script module lang="ts">
  import { getImage } from '$lib/client'
  import { Image } from '$lib/components'
  import { formatTime, linkTo, wrapWithLink } from '$lib/utils'
  import type { Agent, Track } from '@melodie/common/models'
  import type { Tags } from '@melodie/common/types'

  export interface TrackProps {
    agentById: Map<number, Agent>
    src?: Track
    details?: boolean
    class?: string
    onclick?: () => void
  }
</script>

<script lang="ts">
  let {
    agentById,
    src,
    details = false,
    class: className = '',
    onclick,
  }: TrackProps = $props()

  let tags: Partial<Tags> = $derived(src?.tags ?? {})

  let cover = $derived(getImage(src, agentById))
</script>

<button
  class={`${className} md:min-w-200px m-2 flex w-full flex-row items-center`}
  {onclick}
>
  <a
    class="w-16 flex-none"
    href={linkTo('album', src?.albumRef)}
    onclick={() => console.log('navigate album')}
  >
    <Image class="actionable text-xs" height={64} src={cover} width={64} />
  </a>
  <div class="flex flex-grow flex-col items-start justify-start px-2 text-left">
    <span class="text-lg">{tags.title}</span>
    <span
      >{@html src?.artistRefs
        ?.map((artist) => wrapWithLink('artist', artist, 'text-sm'))
        .join(', ')}</span
    >
  </div>
  {#if details}
    <div class="text-lg">{formatTime(tags.duration)}</div>
  {/if}
</button>
