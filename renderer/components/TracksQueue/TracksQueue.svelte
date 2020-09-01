<script>
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import TracksList from '../TracksList/TracksList.svelte'
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'
  import {
    tracks,
    index,
    jumpTo,
    clear,
    remove,
    move
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
</style>

<Heading
  title={$_('queue')}
  image={'../images/jason-rosewell-ASKeuOZqhYU-unsplash.jpg'} />
<div>
  <h3>
    {$_($tracks.length === 1 ? 'a track' : '_ tracks', {
      total: $tracks.length
    })}
  </h3>
  {#if $tracks.length}
    <AddToPlaylist class="mx-4" tracks={$tracks} />
    <span class="totalDuration">{formatTime(sumDurations($tracks))}</span>
    <Button icon="delete" class="mx-4" on:click={() => clear()} />
  {/if}
</div>

<TracksList
  tracks={$tracks}
  currentIndex={$index}
  on:click={({ detail }) => jumpTo(detail)}
  on:move={({ detail: { from, to } }) => move(from, to)}
  on:remove={({ detail }) => remove(detail)} />
