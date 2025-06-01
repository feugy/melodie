<script module lang="ts">
  import { goto } from '$app/navigation'
  import { getImage, screen } from '$lib/client'
  import { Button, Image } from '$lib/components'
  import type { Kind, LightAlbum, LightArtist } from '$lib/types'
  import { linkTo } from '$lib/utils'
  import type { Agent } from '@melodie/common/models'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import OpenIcon from 'lucide-svelte/icons/maximize-2'
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
    kind: Kind
    details?: Snippet
  }
</script>

<script lang="ts" generics="T extends LightAlbum | LightArtist">
  let {
    agentById,
    src,
    kind,
    details,
    size = 250,
    onplay,
    onenqueue,
  }: GridItemInternals<T> & GridItemProps = $props()

  let open = $state(false)
  let link = $derived(linkTo(kind, [src.id, null]))

  function handleClick() {
    if (screen.supportHover) {
      goto(link)
    } else {
      open = !open
    }
  }

  function handleMouseEnter() {
    open = true
  }

  function handleFocusLost() {
    if (open) {
      open = false
    }
  }
</script>

<article
  class="content-visibility-auto relative inline-block text-[0]"
  style="width: {size}px;"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleFocusLost}
>
  <button
    class={[
      kind === 'artists' && 'rounded-full',
      'bg-primary-500/10 inline-block overflow-clip',
    ]}
    onclick={handleClick}
    ><Image
      brokenIcon={kind === 'artists' ? 'user' : 'music'}
      height={size}
      layout="fixed"
      src={getImage(src, agentById, kind)}
      width={size}
    /></button
  >
  <menu
    class={[
      'pointer-events-auto absolute inset-x-0 top-[60%] z-10 flex-wrap justify-center gap-2 text-center opacity-0 transition-opacity duration-500 ease-in-out',
      open && 'pointer-events-auto opacity-100',
    ]}
  >
    {#if !screen.supportHover}<Button
        color="secondary"
        Icon={OpenIcon}
        onclick={(evt) => {
          evt.preventDefault()
          goto(link)
        }}
        size="lg"
      />{/if}
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
    {@render details?.()}
  </footer>
</article>
