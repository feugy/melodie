<script>
  import { _ } from 'svelte-intl'
  import Image from '../Image/Image.svelte'
  import { formatTime, linkTo } from '../../utils'

  export let src
  export let details = false
  $: tags = (src && src.tags) || {}
  $: artist = tags.artists && tags.artists[0]
</script>

<style type="postcss">
  .root {
    @apply flex m-2 items-center text-left;
    min-width: 200px;
  }

  .track {
    @apply flex-grow flex flex-col items-start px-2 justify-start;
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

<div class={`${$$props.class} root`} on:click>
  <a
    on:click|stopPropagation
    href={linkTo('album', tags.album)}
    class="flex-none">
    <Image class="h-16 w-16 text-xs" src={src && src.media} />
  </a>
  <div class="track">
    <span class="title">{tags.title}</span>
    {#if artist}
      <a
        on:click|stopPropagation
        href={linkTo('artist', artist)}
        class="artist underlined">
        {artist}
      </a>
    {/if}
  </div>
  {#if details}
    <div class="duration">{formatTime(tags.duration)}</div>
  {/if}
</div>
