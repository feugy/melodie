<script lang="ts">
  import { Button, Sticky } from '$lib/components'
  import { locale, t } from 'svelte-intl-precompile'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { page } from '$app/state'
  import Album from 'lucide-svelte/icons/disc'
  import Artist from 'lucide-svelte/icons/user'

  interface NavProps {
    class?: string
  }

  let { class: className }: NavProps = $props()

  let isLarge = $state(true)
  let path = $derived(
    page.url.pathname.replace(`${base}/${$locale}`, '').split('/')[1]
  )
</script>

<Sticky>
  {#snippet children(floating)}
    <ul class={['flex w-full flex-row items-center gap-2 p-2', className]}>
      <li>
        <Button
          class="w-full"
          color={path === 'albums' ? 'primary' : 'secondary'}
          Icon={Album}
          onclick={() => goto(`${base}/${$locale}/albums`, { noScroll: true })}
          >{isLarge ? $t('albums') : ''}</Button
        >
      </li>
      <li>
        <Button
          class="w-full"
          color={path === 'artists' ? 'primary' : 'secondary'}
          Icon={Artist}
          onclick={() => goto(`${base}/${$locale}/artists`, { noScroll: true })}
          >{isLarge ? $t('artists') : ''}</Button
        >
      </li>
    </ul>
  {/snippet}
</Sticky>
