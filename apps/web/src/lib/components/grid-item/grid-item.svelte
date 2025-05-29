<script module lang="ts">
  import { getImage } from '$lib/client'
  import { Button, Image } from '$lib/components'
  import type { LightAlbum, LightArtist } from '$lib/types'
  import { linkTo, type LinkTo } from '$lib/utils'
  import type { Agent } from '@melodie/common/models'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import PlayIcon from 'lucide-svelte/icons/play'
  import type { Snippet } from 'svelte'

  export interface GridItemProps {
    agentById: Map<number, Agent>
    size?: number
    onplay?: () => unknown
    onenqueue?: () => unknown
  }

  export interface GridItemInternals<T extends LightAlbum | LightArtist> {
    src: T
    kind: LinkTo
    refs?: Snippet
  }
</script>

<script lang="ts" generics="T extends LightAlbum | LightArtist">
  let {
    agentById,
    src,
    kind,
    refs,
    size = 250,
    onplay,
    onenqueue,
  }: GridItemInternals<T> & GridItemProps = $props()

  let open = $state(false)

  function handleMouseEnter() {
    open = true
  }

  function handleFocusLost() {
    if (open) {
      open = false
    }
  }

  console.log('> coucou', getImage(src, agentById, kind))
</script>

<article
  class="content-visibility-auto relative inline-block text-[0]"
  style="width: {size}px;"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleFocusLost}
>
  <a href={linkTo(kind, [src.id, null])}
    ><Image
      brokenIcon={kind === 'artist' ? 'user' : 'music'}
      class={kind === 'artist' ? 'rounded-full' : ''}
      height={size}
      layout="fixed"
      src={getImage(src, agentById, kind)}
      width={size}
    /></a
  >
  <menu
    class="pointer-events-auto absolute inset-x-0 top-[60%] z-10 flex-wrap justify-center gap-2 text-center opacity-0 transition-opacity duration-500 ease-in-out {open
      ? 'pointer-events-auto opacity-100'
      : ''}"
  >
    {#if onplay}<Button
        color="secondary"
        Icon={PlayIcon}
        onclick={(evt) => {
          evt.preventDefault()
          onplay()
        }}
        size="lg"
      />{/if}
    {#if onenqueue}<Button
        color="secondary"
        Icon={EnqueueIcon}
        onclick={(evt) => {
          evt.preventDefault()
          onenqueue()
        }}
        size="lg"
      />{/if}
  </menu>
  <footer class="overflow-hidden p-2 text-center text-base">
    <p class="truncate">{src.name}</p>
    {@render refs?.()}
  </footer>
</article>
