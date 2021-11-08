<script>
  import { createEventDispatcher } from 'svelte'

  export let type = 'text'
  export let value = ''
  export let icon = undefined
  export let placeholder = ''
  export let focus = false
  let input
  let dispatch = createEventDispatcher()

  $: if (focus && input) {
    input.focus()
  }
</script>

<style lang="postcss">
  span {
    @apply inline-flex items-center;

    &.icon input {
      @apply pl-10;
    }
  }

  input {
    @apply px-2 py-1 outline-none rounded w-full;
    border: solid 1px var(--hover-bg-color);
    background: var(--input-bg-color);
    transition: border-color 0.2s ease-in-out;

    &:focus {
      border-color: var(--primary-color);
    }
  }

  i {
    @apply cursor-pointer z-10;
    margin-right: -2rem;
    margin-left: 0.5rem;
  }
</style>

<span class={$$restProps.class} class:icon>
  {#if icon}
    <i
      class="material-icons"
      on:click|stopPropagation={() => dispatch('iconClick')}
    >
      {icon}
    </i>
  {/if}
  <input
    {type}
    bind:this={input}
    on:input
    on:keyup
    on:keydown
    on:change
    {placeholder}
    {value}
  />
</span>
