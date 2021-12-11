<script>
  export let color = '#2e3141'
  export let inverted = false

  const offset = '7rem'

  $: clipPath = inverted
    ? `polygon(0% 0%, 100% ${offset}, 100% calc(100% - ${offset}), 0 100%)`
    : `polygon(0% ${offset}, 100% 0%, 100% 100%, 0 calc(100% - ${offset}))`
</script>

<style lang="postcss">
  section {
    @apply py-20 relative;
    background-color: var(--color);
    clip-path: var(--clip-path);
  }
</style>

<section style="--color: {color}; --clip-path: {clipPath}">
  <div>
    <slot />
  </div>
</section>
