<script>
  import { createEventDispatcher } from 'svelte'

  export let type = 'text'
  export let value = ''
  export let icon = undefined
  export let placeholder = ''
  let dispatch = createEventDispatcher()
</script>

<style type="postcss">
  span {
    @apply relative;
  }

  input {
    @apply px-2 py-1 outline-none rounded w-full;
    border: solid 2px var(--hover-bg-color);
    background: var(--input-bg-color);
    transition: border-color 0.2s ease-in-out;
  }

  input:focus {
    border-color: var(--primary-color);
  }

  span.icon input {
    @apply pl-10;
  }

  i {
    @apply cursor-pointer z-0 relative;
    margin-right: -2.5rem;
    vertical-align: -0.25rem;
  }
</style>

<span class={$$props.class} class:icon>
  {#if icon}
    <i
      class="material-icons"
      on:click|stopPropagation={() => dispatch('iconClick')}>
      {icon}
    </i>
  {/if}
  <input {type} on:input on:keyup on:keydown on:change {placeholder} {value} />
</span>
