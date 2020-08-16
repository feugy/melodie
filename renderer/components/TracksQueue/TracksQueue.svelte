<script>
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import Track from '../Track/Track.svelte'
  import {
    tracks,
    index,
    jumpTo,
    clear,
    remove
  } from '../../stores/track-queue'
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
    @apply py-1 px-8 flex flex-row items-center;
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
  <h3>
    {$_($tracks.length === 1 ? 'a track' : '_ tracks', {
      total: $tracks.length
    })}
  </h3>
  {#if $tracks.length}
    <span class="totalDuration">{formatTime(sumDurations($tracks))}</span>
    <Button icon="delete" class="mx-4" on:click={() => clear()} />
  {/if}
</div>

<ol>
  {#each $tracks as track, i}
    <li class:current={$index === i} on:click={() => jumpTo(i)}>
      <Track src={track} details class="flex-auto" />
      <Button icon="close" class="mx-4" on:click={() => remove(i)} />
    </li>
  {/each}
</ol>
