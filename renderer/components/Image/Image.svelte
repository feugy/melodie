<script>
  import { toDOMSrc } from '../../utils'

  export let src
  export let rounded = false
  $: hidden = !src
  $: fallback = rounded ? 'person' : 'music_note'

  function handleError() {
    src = null
  }
</script>

<style type="postcss">
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
  class={$$props.class}
  class:rounded-full={rounded}
  class:rounded-sm={!rounded}
  class:hidden
  loading="lazy"
  src={src ? `${toDOMSrc(src)}#nonce=${Math.random()}` : src}
  alt={src} />
{#if hidden}
  <span
    on:click
    class={$$props.class}
    class:rounded-full={rounded}
    class:rounded-sm={!rounded}>
    <i class="material-icons">{fallback}</i>
  </span>
{/if}
