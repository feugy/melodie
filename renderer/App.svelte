<script>
  import { _ } from 'svelte-intl'
  import trackList from './stores/track-list'
  import invoke from './utils/electron-remote'
  const { basename } = require('path')

  async function handleLoad() {
    const result = await invoke('dialog.showOpenDialog', {
      properties: ['openFile', 'multiSelections']
    })
    trackList.add(result.filePaths)
  }
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
  {#if $trackList.tracks.length}
    <ol>
      {#each $trackList.tracks as track}
        <li>{basename(track).replace(/\..+$/, '')}</li>
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
  </p>
  <p>
    {#if $trackList.current}
      <audio autoplay controls src={$trackList.current} />
    {/if}
  </p>
</main>
