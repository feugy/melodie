<script lang="ts">
  import { getImage } from '$lib/client'
  import { Button, Image } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import { linkTo } from '$lib/utils'
  import type { Agent } from '@melodie/common/models'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import PlayIcon from 'lucide-svelte/icons/play'
  import { t } from 'svelte-intl-precompile'

  let {
    agentById,
    album,
    size = 250,
    onplay,
    onenqueue,
  }: {
    agentById: Map<number, Agent>
    album: LightAlbum
    size?: number
    onplay?: () => unknown
    onenqueue?: () => unknown
  } = $props()

  let open = $state(false)

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
  <a class={getImage(album, agentById)} href={linkTo('album', [album.id, null])}
    ><Image
      alt="Album cover for {album.name}"
      brokenIcon="music"
      height={size}
      layout="fixed"
      src={getImage(album, agentById)}
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
  <footer
    class="text-primary-contrast-500 overflow-hidden p-2 text-center text-base"
  >
    <p class="truncate">{album.name}</p>
    {#if album.refs.length}
      <div class="truncate text-xs">
        {$t('by _', {
          values: {
            artists: album.refs.map(([, artist]) => artist).join(', '),
          },
        })}
      </div>
    {/if}
  </footer>
</article>
