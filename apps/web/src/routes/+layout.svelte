<script lang="ts">
  // import { pwaAssetsHead } from 'virtual:pwa-assets/head'
  // import { pwaInfo } from 'virtual:pwa-info'
  import { page } from '$app/stores'
  import type { Snippet } from 'svelte'
  import '../app.css'
  import { configureLocales } from '$lib/utils'

  configureLocales($page.params.locale)
  let { children }: { children: Snippet } = $props()

  //const webManifestLink = $derived(pwaInfo?.webManifest.linkTag ?? '')
</script>

<svelte:head>
  <!--{#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link}
    <link {...link} />
  {/each}
  {@html webManifestLink}-->
</svelte:head>

{@render children?.()}
