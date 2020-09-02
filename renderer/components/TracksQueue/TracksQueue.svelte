<script>
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import SortableList from '../SortableList/SortableList.svelte'
  import Track from '../Track/Track.svelte'
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
  header {
    @apply flex flex-row text-left px-8;
  }

  div {
    @apply my-2;
  }

  .totalDuration {
    @apply flex-grow text-right px-2;
  }

  .row {
    @apply py-1 px-8 flex flex-row items-center cursor-pointer;
  }

  .row.current {
    background-color: var(--outline-color);
  }
</style>

<Heading
  title={$_('queue')}
  image={'../images/jason-rosewell-ASKeuOZqhYU-unsplash.jpg'} />
<header>
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
</header>
<div>
  <SortableList
    items={$tracks}
    on:move={({ detail: { from, to } }) => move(from, to)}>
    <span slot="item" let:item let:i>
      <span class="row" class:current={$index === i} on:click={() => jumpTo(i)}>
        <Track src={item} details class="flex-auto" />
        <Button icon="close" noBorder class="mx-4" on:click={() => remove(i)} />
      </span>
    </span>
  </SortableList>
</div>
