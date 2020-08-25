<script>
  import { slide } from 'svelte/transition'
  import Button from '../Button/Button.svelte'

  export let value
  export let options
  export let valueAsText = true
  export let withArrow = true
  export let text = null

  $: iconOnly = !valueAsText && !text
  $: if (!value && options.length) {
    value = options[0]
  }
  $: if (valueAsText) {
    text = value ? value.label || value : text
  }

  let open = false

  function handleSelect(selected) {
    value = selected
    open = false
  }
</script>

<style type="postcss">
  .wrapper {
    @apply relative inline-flex flex-col items-center;
  }

  .arrow {
    @apply ml-2;
  }

  .arrow:not(.iconOnly) {
    @apply -mr-4;
  }

  ul {
    @apply absolute min-w-full mt-4 rounded;
    top: 100%;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);
  }

  li {
    @apply px-4 py-2 cursor-pointer whitespace-no-wrap flex items-center;
  }

  li:hover {
    color: var(--hover-color);
    background-color: var(--hover-bg-color);
  }

  li > i {
    @apply mr-2;
  }
</style>

<svelte:window on:click={() => (open = false)} />

<span class="wrapper">
  <Button {...$$props} {text} on:click={() => (open = !open)}>
    {#if withArrow}
      <i class:iconOnly class="material-icons arrow">
        {`arrow_drop_${open ? 'up' : 'down'}`}
      </i>
    {/if}
  </Button>
  {#if open}
    <ul transition:slide>
      {#each options as option}
        <li on:click={() => handleSelect(option)}>
          {#if option.icon}
            <i class="material-icons">{option.icon}</i>
          {/if}
          {option.label || option}
        </li>
      {/each}
    </ul>
  {/if}
</span>
