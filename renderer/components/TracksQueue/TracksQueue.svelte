<script>
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import Track from '../Track/Track.svelte'
  import { tracks, index, jumpTo, clear } from '../../stores/track-queue'
  import { formatTime, sumDurations } from '../../utils'
</script>

<style type="postcss">
  div {
    @apply flex flex-row relative text-left px-8;
  }

  .totalDuration {
    @apply flex-grow text-right px-2;
  }

  ol {
    @apply py-2 relative;
  }

  li {
    @apply py-1 px-8;
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
<div>
  <h3>{$_('_ items', { total: $tracks.length })}</h3>
  {#if $tracks.length}
    <Button icon="delete" class="mx-4" on:click={() => clear()} />
    <span class="totalDuration">{formatTime(sumDurations($tracks))}</span>
  {/if}
</div>

<ol>
  {#each $tracks as track, i}
    <li class:current={$index === i} on:click={() => jumpTo(i)}>
      <Track src={track.tags} media={track.media} details />
    </li>
  {/each}
</ol>
