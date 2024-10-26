<script module lang="ts">
  // This Image component is a wrapper arround @unpic/svelte,
  // bound to melodie agent and its image optimization interface.
  import { Image, type ImageProps as Props } from '@unpic/svelte'
  import ImageIcon from 'lucide-svelte/icons/image'
  import Music4 from 'lucide-svelte/icons/music-4'
  import UserRound from 'lucide-svelte/icons/user-round'
  import type { UrlGenerator, UrlTransformer } from 'unpic'

  export type ImageProps = Omit<Props, 'src'> & {
    src?: string
    brokenIcon?: 'music' | 'user'
  }

  const generate: UrlGenerator<{ base: URL }> = ({ base, width, height }) => {
    const url = typeof base === 'string' ? new URL(base) : base
    if (width) {
      url.searchParams.set('w', `${width}`)
    }
    if (height) {
      url.searchParams.set('h', `${height}`)
    }
    url.searchParams.set('f', 'image/avif')
    return url
  }

  const transformer: UrlTransformer = (options) => {
    if (typeof options.url === 'string' && !options.url.startsWith('http')) {
      return options.url
    }
    const url =
      typeof options.url === 'string' ? new URL(options.url) : options.url
    return generate({ ...options, base: url })
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
  <Image {...props as Props} {src} {transformer} onerror={handleError} />
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
