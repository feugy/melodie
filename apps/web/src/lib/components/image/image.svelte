<script module lang="ts">
  import type { ImageProps as Props } from '@unpic/svelte'
  // This Image component is a wrapper arround @unpic/svelte,
  // bound to melodie agent and its image optimization interface.
  import { Image } from '@unpic/svelte/base'
  import ImageIcon from 'lucide-svelte/icons/image'
  import Music4 from 'lucide-svelte/icons/music-4'
  import UserRound from 'lucide-svelte/icons/user-round'
  import type { HTMLImgAttributes } from 'svelte/elements'
  import type { URLTransformer } from 'unpic'

  export type ImageProps = HTMLImgAttributes & {
    src?: string
    width?: number
    height?: number
    aspectRatio?: number
    layout?: 'fixed' | 'constrained'
    brokenIcon?: 'music' | 'user'
  }

  const transformer: URLTransformer = (input, { width, height }) => {
    const url =
      typeof input === 'string' ? new URL(input, 'http://localhost') : input
    if (width) {
      url.searchParams.set('w', `${width}`)
    }
    if (height) {
      url.searchParams.set('h', `${height}`)
    }
    url.searchParams.set('f', 'image/avif')
    return url.toString()
  }

  const brokenSrc = new Set()
</script>

<script lang="ts">
  let { src, brokenIcon, ...props }: ImageProps = $props()
  let isBroken = $state(brokenSrc.has(src))

  const brokenSize = props.width ?? 100

  function handleError() {
    if (src) {
      brokenSrc.add(src)
    }
    isBroken = true
  }
</script>

{#if src && !isBroken}
  <Image
    {...props as unknown as Props}
    {src}
    {transformer}
    onerror={handleError}
  />
{:else}
  <div
    class="flex items-center justify-center"
    style="width: {brokenSize}px; height: {brokenSize}px;"
  >
    {#if brokenIcon === 'music'}<Music4
        size={brokenSize / 3}
      />{:else if brokenIcon === 'user'}<UserRound
        size={brokenSize / 3}
      />{:else}<ImageIcon size={brokenSize / 3} />{/if}
  </div>
{/if}
