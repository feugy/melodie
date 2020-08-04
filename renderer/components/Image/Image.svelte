<script>
  import { toDOMSrc } from '../../utils'

  export let src
  export let rounded = false
</script>

<style type="postcss">
  img {
    @apply border-none block;
    object-fit: cover;
  }
</style>

<img
  on:click
  class={$$props.class}
  class:rounded-full={rounded}
  class:rounded-sm={!rounded}
  loading="lazy"
  src={toDOMSrc(src)}
  alt={src} />
