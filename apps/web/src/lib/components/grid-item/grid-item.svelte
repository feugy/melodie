<script module lang="ts">
  import { goto } from '$app/navigation'
  import { MD, getImage, screen } from '$lib/client'
  import { Button, Image } from '$lib/components'
  import type { Kind, LightAlbum, LightArtist } from '$lib/types'
  import { linkTo } from '$lib/utils'
  import type { Agent } from '@melodie/common/models'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import OpenIcon from 'lucide-svelte/icons/maximize-2'
  import PlayIcon from 'lucide-svelte/icons/play'
  import { type Snippet, onMount } from 'svelte'

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
    detailsHeight?: number
  }
</script>

<script lang="ts" generics="T extends LightAlbum | LightArtist">
  let {
    agentById,
    src,
    kind,
    details,
    detailsHeight = 0,
    size = screen.size <= MD ? 150 : 250,
    onplay,
    onenqueue,
  }: GridItemInternals<T> & GridItemProps = $props()

  let article: HTMLElement | null = null
  let rendered = $state(false)
  let open = $state(false)
  let link = $derived(linkTo(kind, [src.id, null]))

  onMount(() => {
    if (!article) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            rendered = true
            observer.disconnect()
          }
        }
      },
      { rootMargin: `${size}px` }
    )
    observer.observe(article)

    if (screen.supportHover) {
      article.addEventListener('mouseenter', handleMouseEnter)
    }
    return () => {
      article?.removeEventListener('mouseenter', handleMouseEnter)
      observer.disconnect()
    }
  })

  function handleClick() {
    if (screen.supportHover) {
      goto(link)
    } else {
      open = !open
    }
  }

  function handleMouseEnter() {
    open = true
    article?.addEventListener(
      'mouseleave',
      () => {
        open = false
      },
      { once: true }
    )
  }
</script>

<article
  bind:this={article}
  class="relative inline-block text-[0px]"
  style="width: {size}px; height: {size + detailsHeight}px"
>
  {#if rendered}
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
      />
    </button>
    <footer class="overflow-hidden p-2 text-center text-base">
      <p class="truncate">{src.name}</p>
      {@render details?.()}
    </footer>
    <menu
      class={[
        'pointer-events-auto absolute inset-x-0 top-[60%] z-10 flex flex-wrap justify-center gap-2 text-center opacity-0 transition-opacity duration-500 ease-in-out',
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
  {/if}
</article>
