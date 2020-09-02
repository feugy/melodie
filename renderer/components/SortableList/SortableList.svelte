<script>
  import { createEventDispatcher, tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { _ } from 'svelte-intl'

  export let items = []

  const dispatch = createEventDispatcher()
  let from = null
  let keyedItems = []
  let hovered = null

  $: {
    // ensure items have unique keys: same item could appear multiple times in the list
    const unique = new Map()
    keyedItems = []
    for (const item of items) {
      let num = unique.get(item.id) || 0
      unique.set(item.id, ++num)
      keyedItems.push({ ...item, key: `${item.id}-${num}` })
    }
  }

  function handleDrag(evt, idx) {
    from = idx
  }

  async function handleDrop(to) {
    const params = { from, to }
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
  {#each keyedItems as item, i (item.key)}
    <li
      draggable="true"
      class:dropTarget={hovered === i}
      animate:conditionalFlip={{ duration: 250 }}
      on:dragstart={evt => handleDrag(evt, i)}
      on:dragenter={() => (hovered = i)}
      on:drop|preventDefault={() => handleDrop(i)}>
      <slot name="item" {item} {i} />
    </li>
  {/each}
</ol>
