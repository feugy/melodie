<script>
  import 'virtual:windi.css'
  import { onMount } from 'svelte'
  import { _, locale, getBrowserLocale } from 'svelte-intl'
  import '../common'

  onMount(() => locale.set(getBrowserLocale('en')))
</script>

{#if $locale}
  <main>
    <slot />
  </main>
{/if}

<svelte:head>
  <title>{$_('Mélodie')}</title>
  <link rel="icon" href="/favicon.png" type="image/png" />
</svelte:head>
