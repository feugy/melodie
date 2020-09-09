<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import Button from '../Button/Button.svelte'
  import { add } from '../../stores/track-queue'
  import { load } from '../../stores/playlists'
  import { wrapWithLinks } from '../../utils'

  export let src

  async function handlePlay(evt, immediate = true) {
    if (!src.tracks) {
      src = await load(src.id)
    }
    add(src.tracks, immediate)
  }

  async function handleEnqueue(evt) {
    return handlePlay(evt, false)
  }
</script>

<style type="postcss">
  a {
    @apply inline-block w-64 rounded-sm border-2 border-solid p-4 text-left relative;
    border-color: var(--outline-color);
    background-color: var(--hover-bg-color);
  }

  h4 {
    @apply text-sm truncate;
  }

  a:hover .controls {
    @apply opacity-100;
  }

  .controls {
    @apply absolute opacity-0 transition-opacity duration-500 ease-in-out;
    bottom: 0.5rem;
    right: 0.5rem;
  }
</style>

<a href={`#/playlist/${src.id}`} class="{$$props.class} actionable">
  <header>
    <h3>{src.name || $_('unknown')}</h3>
    <h4>
      {$_(src.trackIds.length === 1 ? 'a track' : '_ tracks', {
        total: src.trackIds.length
      })}
    </h4>
  </header>
  <p class="controls">
    <Button
      data-testid="play"
      primary
      icon="play_arrow"
      large
      on:click={handlePlay} />
    <Button
      data-testid="enqueue"
      primary
      icon="playlist_add"
      large
      on:click={handleEnqueue} />
  </p>
</a>
