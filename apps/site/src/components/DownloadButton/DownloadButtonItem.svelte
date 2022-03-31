<script>
  import { createEventDispatcher } from 'svelte'

  export let label
  export let os
  export let file
  export let baseUrl

  const imageBaseUrl = BASE_URL

  const dispatch = createEventDispatcher()

  function handleClick() {
    dispatch('close')
    window.open(`${baseUrl}/${file}`)
  }
</script>

<style lang="postcss">
  div {
    @apply py-1;
  }
  img {
    @apply h-6 inline-block mr-4;
  }
</style>

<div on:click={handleClick}>
  <img src="{imageBaseUrl}/logos/{os}.png" alt={os} /><span>{label}</span>
</div>
