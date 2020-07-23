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
  font-semibold text-white bg-transparent flex-row items-center;

    letter-spacing: 0.25rem;
    line-height: 2.8rem;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
      color 0.2s ease-in-out;
    box-shadow: inset 0 0 0 2px var(--white);
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
    @apply bg-white shadow-none;
    color: var(--dark-grey);
  }

  button:hover,
  button:active {
    box-shadow: inset 0 0 0 2px var(--light-blue);
    color: var(--light-blue);
  }

  button.primary:hover,
  button.primary:active {
    background-color: var(--light-blue);
    color: var(--dark-grey);
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
