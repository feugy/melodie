<script>
  import { fly } from 'svelte/transition'

  export let open = false
  export let width = '30%'
</script>

<div>
  <div class="main">
    <slot name="main" />
  </div>
  {#if open}
    <div
      class={`${$$restProps.class} aside`}
      style={`min-width: ${width}; max-width: ${width}`}
      transition:fly={{ duration: 250, x: 500 }}
    >
      <slot name="aside" />
    </div>
  {/if}
</div>

<style>
  div {
    --at-apply: flex flex-row h-full overflow-x-hidden;
  }

  .main {
    --at-apply: flex-grow;
  }

  .aside {
    --at-apply: block;
  }
</style>
