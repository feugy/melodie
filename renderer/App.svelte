<script>
  import 'smelte/src/tailwind.css'
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Button } from 'smelte'
  import trackList from './stores/track-list'
  import { list as listAlbums } from './stores/albums'
  import invoke from './utils/electron-remote'
  import Layout from './components/Layout.svelte'

  async function handleLoad() {
    const files = await invoke('fileLoader.load')
    if (files) {
      trackList.add(files)
      await listAlbums()
    }
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

<main class="text-center p-1 m-x-auto m-y-0">
  <h1 class="text-3xl font-hairline uppercase">{$_('Mélodie')}</h1>
  <Layout on:select={({ detail }) => trackList.add([detail])} />
  <p>
    <Button on:click={handleLoad}>{$_('load')}</Button>
  </p>
</main>
