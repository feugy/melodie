<script context="module">
  import { load as loadAlbum } from '../../stores/albums'
  import { load as loadArtist } from '../../stores/artists'
  import { load as loadPlaylist } from '../../stores/playlists'

  const load = {
    album: loadAlbum,
    artist: loadArtist,
    playlist: loadPlaylist
  }
</script>

<script>
  import { _ } from 'svelte-intl'
  import { push } from 'svelte-spa-router'
  import Button from '../Button/Button.svelte'
  import { add } from '../../stores/track-queue'
  import { isTouchable } from '../../stores/window'

  export let src
  export let kind
  export let overlay = false

  let open = false

  function handleOpen() {
    push(`#/${kind}/${src.id}`)
  }

  async function handlePlay(evt, immediate = true) {
    if (!src.tracks) {
      src = await load[kind](src.id)
    }
    add(src.tracks, immediate)
  }

  async function handleEnqueue(evt) {
    return handlePlay(evt, false)
  }

  function handleClick() {
    if ($isTouchable) {
      open = !open
    } else {
      handleOpen()
    }
  }

  function handleMouseEnter() {
    if (!$isTouchable) {
      open = true
    }
  }

  function handleFocusLost() {
    if (open) {
      open = false
    }
  }
</script>

<style lang="postcss">
  /* do not apply relative! makes layout very slow when displaying many grid items */
  span {
    @apply inline-block w-32 md:w-48 lg:w-64 cursor-pointer;
    -webkit-tap-highlight-color: transparent;

    &.overlay {
      & .artwork {
        @apply hidden;
      }
      & > header {
        @apply inline-flex w-full h-32 md:h-48 lg:h-64 rounded-sm border-2 border-solid p-4;
        border-color: var(--outline-color);
        background-color: var(--hover-bg-color);

        & > h3 {
          @apply text-2xl;
        }
      }
    }
  }

  header {
    @apply flex flex-col items-center justify-center w-full;

    & > * {
      @apply w-full truncate;
    }

    & h3 {
      @apply text-lg mt-1;
    }
  }

  .content {
    @apply relative;

    & .artwork {
      @apply inline-block h-32 md:h-48 lg:h-64 text-3xl;
    }

    & .controls {
      @apply absolute opacity-0 transition-opacity duration-500 ease-in-out inset-x-0 
        text-center z-10 pointer-events-none flex justify-center flex-wrap gap-2
        top-20px md:top-120px lg:top-190px;

      &.open {
        @apply opacity-100 pointer-events-auto;
      }
    }
  }

  @media (hover: hover) {
    span:hover .controls {
      @apply opacity-100 pointer-events-auto;
    }
  }
</style>

<svelte:body on:click|capture={handleFocusLost} />

<span
  role="article"
  class={$$restProps.class}
  class:overlay
  on:click={handleClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleFocusLost}
>
  <div class="content">
    <span class="artwork">
      <slot />
    </span>
    <p class="controls" class:open>
      {#if $isTouchable}
        <Button
          data-testid="open"
          primary
          icon="open_in_full"
          large
          on:click={handleOpen}
        />
      {/if}
      <Button
        data-testid="play"
        primary
        icon="play_arrow"
        large
        on:click={handlePlay}
      />
      <Button
        data-testid="enqueue"
        primary
        icon="playlist_add"
        large
        on:click={handleEnqueue}
      />
    </p>
  </div>
  <header>
    <h3>{src.name || $_('unknown')}</h3>
    <slot name="details" />
  </header>
</span>
