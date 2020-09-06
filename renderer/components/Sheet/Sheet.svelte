<script>
  import { fly } from 'svelte/transition'

  export let open = false
  export let width = '30%'

  async function handleStart() {
    // Triggers window resize when animation starts because layout has changed
    // Defers it so that page has already layed out
    await new Promise(r => setTimeout(r, 0))
    window.dispatchEvent(new Event('resize'))
  }
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
      transition:fly={{ duration: 250, x: 500 }}
      on:introstart={handleStart}>
      <slot name="aside" />
    </div>
  {/if}
</div>
