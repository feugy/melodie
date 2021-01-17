<script>
  import { _ } from 'svelte-intl'
  import { push } from 'svelte-spa-router'
  import Button from '../Button/Button.svelte'
  import { add } from '../../stores/track-queue'
  import { load } from '../../stores/albums'

  export let src
  export let kind
  export let overlay = false

  let open = false

  function handleOpen() {
    push(`#/${kind}/${src.id}`)
  }

  async function handlePlay(evt, immediate = true) {
    if (!src.tracks) {
      src = await load(src.id)
    }
    add(src.tracks, immediate)
  }

  async function handleEnqueue(evt) {
    return handlePlay(evt, false)
  }

  function handleFocusLost() {
    if (open) {
      open = false
    }
  }
</script>

<style type="postcss">
  span {
    @apply relative inline-block w-32 cursor-pointer;

    &.overlay header {
      @apply absolute inset-0 z-0 p-2;
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
      @apply inline-block h-32 text-3xl;
    }

    & .controls {
      @apply absolute opacity-0 transition-opacity duration-500 ease-in-out inset-x-0 text-center z-10 pointer-events-none flex justify-center flex-wrap gap-2;
      top: 20px;

      &.open {
        @apply opacity-100 pointer-events-auto;
      }
    }
  }

  @screen md {
    span {
      @apply w-48 cursor-default;

      & .content {
        & .controls {
          @apply gap-2;
          top: 120px;
        }

        & .artwork {
          @apply h-48;
        }
      }
    }
  }
  @screen lg {
    span {
      @apply w-64;

      & .content {
        & .controls {
          top: 190px;
        }

        & .artwork {
          @apply h-64;
        }
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
  class={$$restProps.class}
  class:overlay
  on:click={() => (open = !open)}
  on:mouseleave={handleFocusLost}>
  <div class="content">
    <span class="artwork">
      <slot />
    </span>
    <p class="controls" class:open>
      <Button
        data-testid="open"
        primary
        icon="open_in_full"
        large
        on:click={handleOpen}
      />
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
