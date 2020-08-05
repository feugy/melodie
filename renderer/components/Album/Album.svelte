<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import Button from '../Button/Button.svelte'
  import { wrapWithLinks } from '../../utils'

  export let src
  const dispatch = createEventDispatcher()

  function handlePlay(evt) {
    dispatch('play', src)
    evt.stopImmediatePropagation()
  }

  function handleEnqueue(evt) {
    dispatch('enqueue', src)
    evt.stopImmediatePropagation()
  }
</script>

<style type="postcss">
  article {
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

  article:hover .controls {
    @apply opacity-100;
  }

  .controls {
    @apply absolute opacity-0 transition-opacity duration-500 ease-in-out;
    left: 5%;
    bottom: 5%;
  }
</style>

<article class={$$props.class}>
  <div class="content">
    <Image class="w-64 h-64" src={src.media} />
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
    <h3>{src.name}</h3>
    {#if src.linked.length}
      <h4>
        {@html $_('by _', {
          artist: wrapWithLinks('artist', src.linked).join(', ')
        })}
      </h4>
    {/if}
  </header>
</article>
