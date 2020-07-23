<script>
  import { toDOMSrc } from '../../utils'

  export let src
</script>

<style type="postcss">
  img {
    @apply border-none block rounded-sm;
  }
</style>

<img
  on:click
  class={$$props.class}
  loading="lazy"
  src={toDOMSrc(src)}
  alt={src} />
