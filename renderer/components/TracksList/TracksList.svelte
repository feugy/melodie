<script>
  import { createEventDispatcher, tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'

  export let tracks = []
  export let currentIndex = null

  const dispatch = createEventDispatcher()
  let from = null
  let tracksWithKeys = []
  let hovered = null

  $: {
    // ensure tracks have unique keys: same track could appear multiple times in the list
    const unique = new Map()
    tracksWithKeys = []
    for (const track of tracks) {
      let num = unique.get(track.id) || 0
      unique.set(track.id, ++num)
      tracksWithKeys.push({ ...track, key: `${track.id}-${num}` })
    }
  }

  function handleDrag(evt, idx) {
    from = idx
  }

  async function handleDrop(to) {
    let params = { from, to }
    hovered = null
    from = null
    if (params.from !== null) {
      await tick()
      dispatch('move', params)
    }
  }

  function conditionalFlip(...args) {
    return from !== null ? {} : flip(...args)
  }
</script>

<style type="postcss">
  ol {
    @apply p-2 relative;
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

  /*
    Adding pseudo elements during DND is slowing animation down
    In case we want simpler solution, we can just change the drop zone border

  li {
    border: 2px dotted transparent;
  }

  li.dropTarget {
    border-color: var(--outline-color);
  }
  */

  li.dropTarget::before {
    @apply block w-full h-12 border-dotted border-2;
    content: '';
    border-color: var(--outline-color);
  }
</style>

<ol on:dragover|preventDefault on:dragend={() => (hovered = null)}>
  {#each tracksWithKeys as track, i (track.key)}
    <li
      draggable="true"
      class:dropTarget={hovered === i}
      animate:conditionalFlip={{ duration: 250 }}
      on:click={() => dispatch('click', i)}
      on:dragstart={evt => handleDrag(evt, i)}
      on:dragenter={() => (hovered = i)}
      on:drop|preventDefault={() => handleDrop(i)}>
      <span class="row" class:current={currentIndex === i}>
        <Track src={track} details class="flex-auto" />
        <Button
          icon="close"
          noBorder
          class="mx-4"
          on:click={() => dispatch('remove', i)} />
      </span>
    </li>
  {/each}
</ol>
