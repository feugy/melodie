<script lang="ts">
  import { base } from '$app/paths'
  import { getImage } from '$lib/client'
  import { Image } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import type { Agent } from '@melodie/common/models'
  import { locale, t } from 'svelte-intl-precompile'

  let {
    agentById,
    album,
    size = 250,
  }: {
    agentById: Map<number, Agent>
    album: LightAlbum
    size?: number
  } = $props()
</script>

<article
  class="content-visibility-auto inline-block text-[0]"
  style="width: {size}px;"
>
  <a class="text-secondary-500" href="{base}/{$locale}/albums/{album.id}"
    ><Image
      alt="Album cover for {album.name}"
      brokenIcon="music"
      height={size}
      layout="fixed"
      src={getImage(album, agentById)}
      width={size}
    /></a
  >
  <footer class="text-primary-800 overflow-hidden p-2 text-center text-base">
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
