<script lang="ts">
  import { Image } from '$lib/components'
  import type { Album } from '@melodie/common/models'
  import type { PartialWithReq } from '@melodie/common/types'
  import { locale, t } from 'svelte-intl-precompile'

  let {
    album,
    size = 250,
  }: {
    album: PartialWithReq<Album, 'id' | 'name' | 'refs'>
    size?: number
  } = $props()
</script>

<article
  class="content-visibility-auto inline-block text-[0]"
  style="width: {size}px;"
>
  <a class="text-secondary-500" href="/{$locale}/albums/{album.id}"
    ><Image
      alt="Album cover for {album.name}"
      brokenIcon="music"
      height={size}
      layout="fixed"
      src="/api/{album.agentId}/albums/{album.id}/media/{album.mediaCount}"
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
