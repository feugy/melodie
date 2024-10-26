<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import { _ } from 'svelte-intl'

  import { showSnack } from '../../stores/snackbars'
  import {
    clear,
    index,
    jumpTo,
    move,
    remove,
    tracks
  } from '../../stores/track-queue'
  import { current } from '../../stores/tutorial'
  import { formatTime, sumDurations } from '../../utils'
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'
  import Button from '../Button/Button.svelte'
  import Heading from '../Heading/Heading.svelte'
  import SortableList from '../SortableList/SortableList.svelte'
  import Sticky from '../Sticky/Sticky.svelte'
  import Track from '../Track/Track.svelte'

  export let withClose = false

  let list
  let previousCurrent
  const dispatch = createEventDispatcher()

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
        if (current && current !== previousCurrent) {
          current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          previousCurrent = current
        }
      }
    })
  )
</script>

<Sticky>
  <header>
    <h3>
      {$_($tracks.length === 1 ? 'a track' : '_ tracks', {
        total: $tracks.length
      })}
    </h3>
    {#if $tracks.length}
      <AddToPlaylist tracks={$tracks} noBorder />
      <span class="totalDuration">{formatTime(sumDurations($tracks))}</span>
      <Button
        icon="i-mdi-delete"
        on:click={handleClear}
        data-testid="clear-button"
      />
    {:else}<span class="totalDuration" />{/if}
    {#if withClose}
      <Button icon="i-mdi-close" primary on:click={() => dispatch('close')} />
    {/if}
  </header>
</Sticky>
<Heading
  title={$_('queue')}
  image={'../images/jason-rosewell-ASKeuOZqhYU-unsplash.jpg'}
/>
<div bind:this={list}>
  <SortableList
    items={$tracks}
    on:move={({ detail: { from, to } }) => move(from, to)}
  >
    <button
      slot="item"
      let:item
      let:i
      class="row"
      class:current={$index === i}
      on:click={() => jumpTo(i)}
    >
      <Track src={item} details class="flex-auto" />
      <Button
        icon="i-mdi-close"
        noBorder
        class="mx-2"
        on:click={() => handleRemove(i)}
      />
    </button>
  </SortableList>
</div>

<style>
  header {
    --at-apply: w-full flex flex-row items-center p-2 gap-2;
    line-height: 1.8rem;
  }

  div {
    --at-apply: my-2;
  }

  .totalDuration {
    --at-apply: flex-grow text-right px-2;
  }

  .row {
    --at-apply: py-1 px-2 flex flex-row items-center cursor-pointer w-full;

    &.current {
      background-color: var(--outline-color);
    }
  }
</style>
