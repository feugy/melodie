<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import { formatTime } from '../../utils'

  export let src
  export let media = null
  export let details = false
  $: artist = src.artists && src.artists[0]
</script>

<style type="postcss">
  .root {
    @apply flex m-2 items-center text-left;
  }

  .track {
    @apply flex-grow flex flex-col;
  }

  .title {
    @apply px-2 text-lg;
  }

  .artist {
    @apply px-2 text-sm;
  }

  .duration {
    @apply text-lg;
  }
</style>

<div class="root" on:click>
  {#if media}
    <Image class="h-16 w-16 flex-none" src={media} />
  {/if}
  <div class="track">
    <span class="title">{src.title}</span>
    <span class="artist">{artist}</span>
  </div>
  {#if details}
    <div class="duration">{formatTime(src.duration)}</div>
  {/if}
</div>
