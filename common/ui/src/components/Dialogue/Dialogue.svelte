<script>
  import Portal from 'svelte-portal'
  import { afterUpdate, createEventDispatcher } from 'svelte'
  import Button from '../Button/Button.svelte'

  export let open
  export let title
  export let noClose = false

  const dispatch = createEventDispatcher()
  let previous = null

  afterUpdate(() => {
    if (previous === null) {
      previous = open
    } else if (previous !== open) {
      dispatch(previous ? 'close' : 'open')
      previous = open
    }
  })

  function close() {
    if (!noClose) {
      open = false
    }
  }

  function handleKeyup({ key }) {
    if (key === 'Escape') {
      close()
    }
  }
</script>

<style type="postcss">
  .backdrop,
  .filter {
    @apply fixed flex items-center justify-center inset-0 m-0 z-10 p-10;
    visibility: hidden;
  }

  .filter.open {
    @apply visible;
    backdrop-filter: blur(2px);
  }

  .backdrop {
    opacity: 0;
    transition: all 0.35s ease;
    background-color: var(--backdrop-color);

    &.open {
      @apply opacity-100 visible;
    }
  }

  article {
    @apply flex flex-col text-center w-full max-h-full;
  }

  .content {
    @apply overflow-y-auto;
  }

  header {
    @apply mb-4 p-4 text-2xl uppercase font-semibold;
    border-bottom: 1px solid var(--outline-color);
  }

  footer {
    @apply mt-4;
  }

  @screen md {
    article {
      width: 80%;
      max-height: 80%;
    }
  }

  @screen lg {
    article {
      width: 70%;
    }
  }

  @screen xl {
    article {
      width: 50%;
    }
  }
</style>

<svelte:body on:keyup={handleKeyup} />
<Portal>
  <div class="filter" class:open />
  <div class="backdrop" class:open on:click={close}>
    {#if !noClose}
      <Button
        icon={'close'}
        class="absolute top-0 right-0 m-4"
        on:click={close}
      />
    {/if}
    <article role="dialog" on:click|stopPropagation>
      <header>{title}</header>
      <div class="content">
        <slot name="content" />
      </div>
      <footer>
        <slot name="buttons" />
      </footer>
    </article>
  </div>
  <!-- Svelte issue: https://github.com/sveltejs/svelte/issues/4546 -->
  {#if false}
    <slot />
  {/if}
</Portal>
