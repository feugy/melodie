<script>
  import { onMount, tick } from 'svelte'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import SortableList from '../SortableList/SortableList.svelte'
  import Track from '../Track/Track.svelte'
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'
  import Sticky from '../Sticky/Sticky.svelte'
  import {
    tracks,
    index,
    jumpTo,
    clear,
    remove,
    move
  } from '../../stores/track-queue'
  import { showSnack } from '../../stores/snackbars'
  import { current } from '../../stores/tutorial'
  import { formatTime, sumDurations } from '../../utils'

  let list

  function handleRemove(i) {
    if ($current !== null && $tracks.length === 1) {
      showSnack({ message: $_('no clear during tutorial') })
      return
    }
    remove(i)
  }

  function handleClear() {
    if ($current !== null) {
      showSnack({ message: $_('no clear during tutorial') })
      return
    }
    clear()
  }

  onMount(() =>
    index.subscribe(async () => {
      // we need to await until SortableList animations are over
      await new Promise(r => setTimeout(r, 300))
      if (list) {
        const current = list.querySelector('.current')
        if (current) {
          current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    })
  )
</script>

<style type="postcss">
  header {
    @apply flex flex-row text-left;
    padding: 1.2rem;
  }

  div {
    @apply my-2;
  }

  .totalDuration {
    @apply flex-grow text-right px-2;
  }

  .row {
    @apply py-1 px-2 flex flex-row items-center cursor-pointer;

    &.current {
      background-color: var(--outline-color);
    }
  }
</style>

<Sticky>
  <header>
    <h3>
      {$_($tracks.length === 1 ? 'a track' : '_ tracks', {
        total: $tracks.length
      })}
    </h3>
    {#if $tracks.length}
      <AddToPlaylist class="mx-4" tracks={$tracks} />
      <span class="totalDuration">{formatTime(sumDurations($tracks))}</span>
      <Button icon="delete" class="ml-2" on:click={handleClear} />
    {/if}
  </header>
</Sticky>
<Heading
  title={$_('queue')}
  image={'../images/jason-rosewell-ASKeuOZqhYU-unsplash.jpg'} />
<div bind:this={list}>
  <SortableList
    items={$tracks}
    on:move={({ detail: { from, to } }) => move(from, to)}>
    <span slot="item" let:item let:i>
      <span class="row" class:current={$index === i} on:click={() => jumpTo(i)}>
        <Track src={item} details class="flex-auto" />
        <Button
          icon="close"
          noBorder
          class="mx-2"
          on:click={() => handleRemove(i)} />
      </span>
    </span>
  </SortableList>
</div>
