<script>
  import Image from '../Image/Image.svelte'
  import TrackDropdown from '../TrackDropdown/TrackDropdown.svelte'
  import { formatTime, linkTo, wrapWithLink } from '../../utils'

  export let src
  export let details = false
  export let withMenu = false
  $: tags = (src && src.tags) || {}
</script>

<style type="postcss">
  .root {
    @apply flex m-2 items-center text-left;
  }

  .track {
    @apply flex-grow flex flex-col items-start px-2 justify-start;
  }

  .title {
    @apply text-lg;
  }

  .duration {
    @apply text-lg;
  }

  @screen md {
    .root {
      min-width: 200px;
    }
  }
</style>

<div class={`${$$restProps.class} root`} on:click>
  <a
    on:click|stopPropagation
    href={linkTo('album', src.albumRef)}
    class="flex-none"
  >
    <Image
      class="h-16 w-16 text-xs actionable"
      src={src && src.media ? `${window.dlUrl}${src.media}` : null}
    />
  </a>
  <div class="track">
    <span class="title">{tags.title}</span>
    <span
      >{@html src?.artistRefs
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
</div>
