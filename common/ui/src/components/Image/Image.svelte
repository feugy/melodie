<script context="module">
  export const broken = new Set()
</script>

<script>
  export let src
  export let rounded = false
  export let fallback = rounded ? 'person' : 'music_note'
  export let width = 256
  export let height = 256
  export let withNonce = false
  // exposed dimension
  export let dimension = null

  $: hidden = !src || broken.has(src)

  function handleError() {
    if (src) {
      broken.add(src)
    }
    src = null
  }

  function handleLoad() {
    dimension = { width: this.naturalWidth, height: this.naturalHeight }
  }

  function toDOMSrc(path) {
    return path && path.replace(/#/g, '%23')
  }
</script>

<style lang="postcss">
  img {
    @apply border-none;
    font-size: 0;
    object-fit: cover;
    background-color: var(--hover-bg-color);
  }

  span {
    @apply inline-flex justify-center items-center;
    background-color: var(--hover-bg-color);
  }

  i {
    font-size: 200%;
  }
</style>

<img
  on:click
  on:error={handleError}
  on:load={handleLoad}
  {width}
  {height}
  {...$$restProps}
  class:rounded-full={rounded}
  class:rounded-sm={!rounded}
  class:hidden
  loading="lazy"
  src={src && !broken.has(src)
    ? withNonce
      ? `${toDOMSrc(src)}#nonce=${Math.random()}`
      : toDOMSrc(src)
    : null}
  alt={src}
/>
{#if hidden}
  <span
    on:click
    class={$$restProps.class}
    class:rounded-full={rounded}
    class:rounded-sm={!rounded}
  >
    <i class="material-icons">{fallback}</i>
  </span>
{/if}
