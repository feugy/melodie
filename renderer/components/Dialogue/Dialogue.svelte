<script>
  import { afterUpdate, createEventDispatcher } from 'svelte'
  import Button from '../Button/Button.svelte'

  export let open
  export let title

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
  }

  .backdrop.open {
    @apply opacity-100 visible;
  }

  article {
    @apply flex flex-col;
    width: 50%;
    max-height: 80%;
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
</style>

<div class="filter" class:open />
<div class="backdrop" class:open on:click={() => (open = false)}>
  <Button
    icon={'close'}
    class="absolute top-0 right-0 m-4"
    on:click={() => (open = false)} />
  <article on:click|stopPropagation>
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
