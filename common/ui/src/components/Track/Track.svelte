<script>
  import { formatTime, linkTo, wrapWithLink } from '../../utils'
  import Image from '../Image/Image.svelte'
  import TrackDropdown from '../TrackDropdown/TrackDropdown.svelte'

  export let src
  export let details = false
  export let withMenu = false
  $: tags = (src && src.tags) || {}
</script>

<button class={`${$$restProps.class} root`} on:click>
  <a on:click|stopPropagation href={linkTo('album', src.albumRef)}>
    <Image class="h-16 w-16 text-xs actionable" src={src?.media} />
  </a>
  <div class="track">
    <span class="title">{tags.title}</span>
    <span>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html src?.artistRefs
        .map(artist => wrapWithLink('artist', artist, 'text-sm'))
        .join(', ')}</span
    >
  </div>
  {#if details}
    <div class="duration">{formatTime(tags.duration)}</div>
  {/if}
  {#if withMenu}
    <TrackDropdown track={src} on:showDetails />
  {/if}
</button>

<style>
  .root {
    /* prettier-ignore */
    --at-apply: flex m-2 text-left md:min-w-200px;
  }

  .track {
    --at-apply: flex-grow flex flex-col items-start px-2 justify-start;
  }

  .title {
    --at-apply: text-lg;
  }

  .duration {
    --at-apply: text-lg;
  }

  a {
    --at-apply: flex-none w-16;
  }
</style>
