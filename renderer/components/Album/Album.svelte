<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import Button from '../Button/Button.svelte'
  import { add } from '../../stores/track-queue'
  import { load } from '../../stores/albums'
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
    @apply cursor-pointer inline-block w-64;
  }

  header {
    @apply text-left;
  }

  h4 {
    @apply text-sm truncate;
  }

  .content {
    @apply relative;
  }

  a:hover .controls {
    @apply opacity-100;
  }

  .controls {
    @apply absolute opacity-0 transition-opacity duration-500 ease-in-out;
    left: 5%;
    bottom: 5%;
  }
</style>

<a href={`#/album/${src.id}`} class={$$props.class}>
  <div class="content">
    <Image class="w-64 h-64 text-3xl" src={src.media} />
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
  </div>
  <header>
    <h3>{src.name || $_('unknown')}</h3>
    {#if src.refs.length}
      <h4>
        {@html $_('by _', {
          artist: wrapWithLinks('artist', src.refs).join(', ')
        })}
      </h4>
    {/if}
  </header>
</a>
