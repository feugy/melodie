<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { page } from '$app/state'
  import { MD, screen } from '$lib/client'
  import AlbumIcon from 'lucide-svelte/icons/disc'
  import PlaylistIcon from 'lucide-svelte/icons/list-music'
  import ArtistIcon from 'lucide-svelte/icons/user'
  import type { Snippet } from 'svelte'
  import { locale, t } from 'svelte-intl-precompile'
  import Button  from '../button/button.svelte'
  import Sticky from '../sticky/sticky.svelte'

  interface NavProps {
    class?: string
  }

  let { class: className }: NavProps = $props()

  let isLarge = $derived(screen.size >= MD)
  let path = $derived(
    page.url.pathname.replace(`${base}/${$locale}`, '').split('/')[1]
  )
</script>

{#snippet albumContent()}{$t('albums')}{/snippet}
{#snippet artistContent()}{$t('artists')}{/snippet}
{#snippet playlistContent()}{$t('playlists')}{/snippet}

<Sticky>
  <ul class={['flex w-full flex-row items-center gap-2 px-4 py-2', className]}>
    <li>
      <Button
        color={path === 'albums' ? 'primary' : 'secondary'}
        Icon={AlbumIcon}
        onclick={() => goto(`${base}/${$locale}/albums`, { noScroll: true })}
        children={isLarge ? (albumContent as unknown as Snippet) : undefined}
      />
    </li>
    <li>
      <Button
        color={path === 'artists' ? 'primary' : 'secondary'}
        Icon={ArtistIcon}
        onclick={() => goto(`${base}/${$locale}/artists`, { noScroll: true })}
        children={isLarge ? (artistContent as unknown as Snippet) : undefined}
      />
    </li>
    <li>
      <Button
        color={path === 'playlists' ? 'primary' : 'secondary'}
        Icon={PlaylistIcon}
        onclick={() => goto(`${base}/${$locale}/playlists`, { noScroll: true })}
        children={isLarge ? (playlistContent as unknown as Snippet) : undefined}
      />
    </li>
  </ul>
</Sticky>
