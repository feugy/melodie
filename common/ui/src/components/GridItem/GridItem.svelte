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

  import { add } from '../../stores/track-queue'
  import { isTouchable } from '../../stores/window'
  import Button from '../Button/Button.svelte'

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

<svelte:body on:click|capture={handleFocusLost} />

<span
  role="tab"
  tabindex="0"
  class={$$restProps.class}
  class:overlay
  on:keyup
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
          icon="i-mdi-arrow-top-right-bottom-left"
          large
          on:click={handleOpen}
        />
      {/if}
      <Button
        data-testid="play"
        primary
        icon="i-mdi-play"
        large
        on:click={handlePlay}
      />
      <Button
        data-testid="enqueue"
        primary
        icon="i-mdi-playlist-plus"
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

<style>
  /* do not apply relative! makes layout very slow when displaying many grid items */
  span,
  span .artwork {
    /* prettier-ignore */
    --at-apply: w-32 md:w-48 lg:w-64;
  }

  span {
    --at-apply: inline-block cursor-pointer;
    -webkit-tap-highlight-color: transparent;

    &.overlay {
      & .artwork {
        --at-apply: hidden;
      }
      & > header {
        /* prettier-ignore */
        --at-apply: inline-flex w-full h-32 md:h-48 lg:h-64 rounded-sm
          border-2 border-solid p-4;
        border-color: var(--outline-color);
        background-color: var(--hover-bg-color);

        & > h3 {
          --at-apply: text-2xl;
        }
      }
    }
  }

  header {
    --at-apply: flex flex-col items-center justify-center w-full;

    & > * {
      --at-apply: w-full truncate;
    }

    & h3 {
      --at-apply: text-lg mt-1;
    }
  }

  .content {
    --at-apply: relative;

    & .artwork {
      /* prettier-ignore */
      --at-apply: inline-block h-32 md:h-48 lg:h-64 text-3xl;
    }

    & .controls {
      /* prettier-ignore */
      --at-apply: absolute opacity-0 transition-opacity duration-500 ease-in-out
        inset-x-0 text-center z-10 pointer-events-none flex justify-center
        flex-wrap gap-2 top-20px md:top-120px lg:top-190px;

      &.open {
        --at-apply: opacity-100 pointer-events-auto;
      }
    }
  }

  @media (hover: hover) {
    span:hover .controls {
      --at-apply: opacity-100 pointer-events-auto;
    }
  }
</style>
