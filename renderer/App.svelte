<script>
  import 'smelte/src/tailwind.css'
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Button, ProgressLinear } from 'smelte'
  import trackList from './stores/track-list'
  import { list as listAlbums } from './stores/albums'
  import { invoke } from './utils'
  import Layout from './components/Layout.svelte'

  let isLoading = false
  async function handleLoad() {
    const folders = await invoke('fileLoader.chooseFolders')
    isLoading = true
    await invoke('fileLoader.crawl', folders)
    isLoading = false
    invoke('fileLoader.watch', folders)
  }

  onMount(listAlbums)
</script>

<style>
  h1 {
    color: #ff3e00;
  }
</style>

<svelte:options immutable={true} />

<svelte:head>
  <title>{$_('Mélodie')}</title>
</svelte:head>
<main class="p-4 m-y-0 text-center">
  <h1 class="text-3xl font-hairline uppercase">{$_('Mélodie')}</h1>
  {#if isLoading}
    <ProgressLinear />
  {:else}
    <p>
      <Button on:click={handleLoad}>{$_('load')}</Button>
    </p>
  {/if}
  <Layout on:select={({ detail }) => trackList.add([detail])} />
</main>
