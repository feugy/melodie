<script>
  import { fly } from 'svelte/transition'

  export let open = false
  export let width = '30%'
</script>

<style type="postcss">
  div {
    @apply flex flex-row h-full overflow-x-hidden;
  }

  .main {
    @apply flex-grow;
  }

  .aside {
    @apply block;
  }
</style>

<div>
  <div class="main">
    <slot name="main" />
  </div>
  {#if open}
    <div
      class={`${$$props.class} aside`}
      style={`min-width: ${width}; max-width: ${width}`}
      transition:fly={{ duration: 250, x: 500 }}>
      <slot name="aside" />
    </div>
  {/if}
</div>
