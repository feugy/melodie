<script>
  import '$lib/common'

  import { onMount } from 'svelte'
  import { _, getBrowserLocale, locale } from 'svelte-intl'

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
