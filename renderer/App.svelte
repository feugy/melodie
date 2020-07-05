<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import trackList from './stores/track-list'
  import {
    albums,
    list as listAlbums,
    open as openAlbum
  } from './stores/albums'
  import invoke from './utils/electron-remote'
  import Tags from './components/Tags.svelte'
  import Album from './components/Album.svelte'
  const { basename } = require('path')

  let current

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
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<svelte:head>
  <title>{$_('Mélodie')}</title>
</svelte:head>

<main>
  <h1>{$_('Mélodie')}</h1>
  {#if $albums.length}
    <ul>
      {#each $albums as src}
        <li>
          <Album
            {src}
            on:open={({ detail }) => openAlbum(detail)}
            on:play={({ detail }) => trackList.add([detail])} />
        </li>
      {/each}
    </ul>
  {/if}
  {#if $trackList.tracks.length}
    <ol>
      {#each $trackList.tracks as track}
        <li>
          <Tags src={track.tags} />
        </li>
      {/each}
    </ol>
    <div>
      <button on:click={() => trackList.previous()}>{$_('previous')}</button>
      <span>
        {$_('_ / _', {
          current: $trackList.index + 1,
          total: $trackList.tracks.length
        })}
      </span>
      <button on:click={() => trackList.next()}>{$_('next')}</button>
    </div>
  {:else}
    <p>{$_('start loading some tracks')}</p>
  {/if}
  <p>
    <button on:click={handleLoad}>{$_('load')}</button>
    <button on:click={() => trackList.clear()}>{$_('clear')}</button>
  </p>
  {#if $trackList.current}
    <p>
      <Tags src={$trackList.current.tags} />
    </p>
    <p>
      <audio
        autoplay
        controls
        src={$trackList.current.path.replace(/#/g, '%23')} />
    </p>
  {/if}
</main>
