<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import { formatTime, linkTo } from '../../utils'

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
    @apply flex-grow flex flex-col items-start px-2;
  }

  .title {
    @apply text-lg;
  }

  .artist {
    @apply text-sm;
  }

  .duration {
    @apply text-lg;
  }
</style>

<div class="root" on:click>
  {#if media}
    <a
      on:click|stopPropagation
      href={linkTo('album', src.album)}
      class="flex-none">
      <Image class="h-16 w-16" src={media} />
    </a>
  {/if}
  <div class="track">
    <span class="title">{src.title}</span>
    <a
      on:click|stopPropagation
      href={linkTo('artist', artist)}
      class="artist underlined">
      {artist}
    </a>
  </div>
  {#if details}
    <div class="duration">{formatTime(src.duration)}</div>
  {/if}
</div>
