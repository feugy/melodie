<script>
  import { _ } from 'svelte-intl'
  import Heading from '../Heading/Heading.svelte'
  import Track from '../Track/Track.svelte'
  import { tracks, index } from '../../stores/track-queue'
</script>

<style type="postcss">
  h3 {
    @apply relative text-left px-8;
  }

  ol {
    @apply py-2 relative;
  }

  li {
    @apply p-2;
  }

  li.current {
    background-color: var(--outline-color);
  }

  li:hover {
    @apply cursor-pointer;
    background-color: var(--hover-primary-color);
  }
</style>

<Heading
  title={$_('playlist')}
  image={'../images/jason-rosewell-ASKeuOZqhYU-unsplash.jpg'} />
<h3>{$_('_ items', { total: $tracks.length })}</h3>

<ol>
  {#each $tracks as track, i}
    <li class:current={$index === i}>
      <Track src={track.tags} media={track.media} />
    </li>
  {/each}
</ol>
