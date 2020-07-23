<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'

  export let src
  export let media = null
  $: artist = src.artists && src.artists[0]
</script>

<style type="postcss">
  .container {
    @apply flex m-2 items-center text-left;
  }
</style>

<div class="container" on:click>
  {#if media}
    <Image class="h-16 w-16 flex-none" src={media} />
  {/if}
  <div class="flex flex-col">
    <span class="px-2 text-lg">{src.title}</span>
    <span class="px-2 text-sm">{artist}</span>
  </div>
</div>
