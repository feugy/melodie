<script>
  import { assets } from '$app/paths'

  /** @type {string} */
  export let label
  /** @type {string} */
  export let os
  /** @type {string} */
  export let file
  /** @type {string} */
  export let baseUrl
</script>

<a href={`${baseUrl}/${file}`} target="_blank" on:click>
  <img src="{assets}/logos/{os}.png" alt={os} /><span>{label}</span>
</a>

<style lang="postcss">
  a {
    --at-apply: py-1;
  }
  img {
    --at-apply: h-6 inline-block mr-4;
  }
</style>
