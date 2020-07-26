<script>
  export let text = null
  export let primary = false
  export let icon = null
  export let large = false
  export let noBorder = false
  $: iconOnly = !text
</script>

<style type="postcss">
  button {
    @apply inline-flex border-none cursor-pointer px-6 uppercase text-sm
  font-semibold bg-transparent flex-row items-center rounded;
    color: var(--color-2);
    letter-spacing: 0.1rem;
    line-height: 2.8rem;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
      color 0.2s ease-in-out;
    box-shadow: inset 0 0 0 2px var(--outline-color);
  }

  button:focus {
    @apply outline-none;
  }

  button.noBorder,
  button.noBorder:hover,
  button.noBorder:active {
    @apply shadow-none;
  }

  button.large {
    @apply text-lg;
    line-height: 4rem;
  }

  button > i {
    font-size: 150%;
  }

  button.large:not(.iconOnly) {
    @apply px-8;
  }

  .primary {
    @apply shadow-none;
    background-color: var(--primary-color);
  }

  button:hover,
  button:active {
    background-color: var(--hover-color);
  }

  button.primary:hover,
  button.primary:active {
    background-color: var(--hover-primary-color);
  }

  :not(.iconOnly) > i {
    margin-left: -0.3em;
    margin-right: 0.3em;
  }

  .iconOnly {
    @apply p-2 rounded-full;
  }
</style>

<button
  class:primary
  class:iconOnly
  class:large
  class:noBorder
  data-testid={$$props['data-testid']}
  class={$$props.class}
  on:click>
  {#if icon}
    <i class="material-icons">{icon}</i>
  {/if}
  {#if text}
    <span>{text}</span>
  {/if}
</button>
