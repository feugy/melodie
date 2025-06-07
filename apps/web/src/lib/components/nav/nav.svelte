<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { page } from '$app/state'
  import { MD, screen } from '$lib/client'
  import { Button, Sticky } from '$lib/components'
  import AlbumIcon from 'lucide-svelte/icons/disc'
  import TrackListIcon from 'lucide-svelte/icons/music-2'
  import ArtistIcon from 'lucide-svelte/icons/user'
  import type { Snippet } from 'svelte'
  import { locale, t } from 'svelte-intl-precompile'

  interface NavProps {
    trackListOpen?: boolean
    class?: string
  }

  let { trackListOpen = $bindable(), class: className }: NavProps = $props()

  let isLarge = $derived(screen.size >= MD)
  let path = $derived(
    page.url.pathname.replace(`${base}/${$locale}`, '').split('/')[1]
  )
</script>

{#snippet albumContent()}{$t('albums')}{/snippet}
{#snippet artistContent()}{$t('artists')}{/snippet}

<Sticky>
  <ul class={['flex w-full flex-row items-center gap-2 p-2', className]}>
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
    {#if screen.size < MD}
      <li>
        <Button
          color={trackListOpen ? 'primary' : 'secondary'}
          Icon={TrackListIcon}
          onclick={() => (trackListOpen = !trackListOpen)}
        />
      </li>
    {/if}
  </ul>
</Sticky>
