<script>
  import { flip } from 'svelte/animate'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import Track from '../Track/Track.svelte'
  import {
    tracks,
    index,
    jumpTo,
    clear,
    remove,
    move
  } from '../../stores/track-queue'
  import { formatTime, sumDurations } from '../../utils'

  let dropIdx = null
  let dragIdx = null
  let tracksWithKeys = []

  $: {
    // ensure tracks have unique keys: same track could appear multiple times in the list
    const unique = new Map()
    tracksWithKeys = []
    for (const track of $tracks) {
      let num = unique.get(track.id) || 0
      unique.set(track.id, ++num)
      tracksWithKeys.push({ ...track, key: `${track.id}-${num}` })
    }
  }

  function handleDrop(evt) {
    if (dragIdx !== null && dropIdx !== null) {
      move(dragIdx, dropIdx)
    }
    dragIdx = null
    dropIdx = null
  }
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

  .row {
    @apply py-1 px-8 flex flex-row items-center cursor-pointer;
  }

  .row.current {
    background-color: var(--outline-color);
  }

  /*
    This is very confusing, as the :hover state is disabled during drag'n drop, and 
    keeps hovering the wrong element.

  .row:hover {
    background-color: var(--hover-primary-color);
  }
  */

  li.dropTarget {
    @apply border-dotted border-2;
    border-color: var(--outline-color);
  }

  /*
    While this perfectly works on Firefox, adding content to the drop zone is buggy on Chrome.
    pointer-events: none; doesn't help.

  li.dropTarget::before {
    @apply block w-full h-12 border-dotted border-2;
    content: '';
    border-color: var(--outline-color);
  }
  */
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
  {#each tracksWithKeys as track, i (track.key)}
    <li
      class:dropTarget={dropIdx === i}
      on:click={() => jumpTo(i)}
      draggable="true"
      on:dragstart={() => (dragIdx = i)}
      on:drop|preventDefault={handleDrop}
      on:dragleave={() => (dropIdx = null)}
      on:dragover|preventDefault={() => (dropIdx = i)}
      animate:flip={{ duration: dragIdx !== null ? 0 : 250 }}>
      <span class="row" class:current={$index === i}>
        <Track src={track} details class="flex-auto" />
        <Button icon="close" class="mx-4" on:click={() => remove(i)} />
      </span>
    </li>
  {/each}
</ol>
