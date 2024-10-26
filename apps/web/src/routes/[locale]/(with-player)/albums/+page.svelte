<script lang="ts">
  import { Album, Heading } from '$lib/components'
  import type { LightAlbum } from '$lib/types'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  let albums = $state<LightAlbum[]>(data.firstAlbums)
  data.albums?.then((value) => {
    albums = value
  })
</script>

<Heading class="preset-tonal-surface">
  {$t('_ albums', { values: { total: albums.length } })}
</Heading>

<div class="flex flex-wrap gap-x-4 p-4" data-sveltekit-preload-data="false">
  {#each albums as album (album.id)}
    <Album {album} />
  {/each}
</div>
