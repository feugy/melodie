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
  <link
    rel="preload"
    href="/fonts/MaterialIcons.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  <link
    rel="preload"
    href="/fonts/Raleway.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  <link
    rel="preload"
    href="/fonts/Raleway-SemiBold.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  <link
    rel="preload"
    href="/fonts/SourceSansPro-Light.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
</svelte:head>
