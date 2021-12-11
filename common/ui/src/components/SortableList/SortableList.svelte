<script>
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'

  export let items = []

  const dispatch = createEventDispatcher()
  let dragged = null
  let target = null
  let keyedItems = []
  let previousY = null
  // there is a bug in Chrome: when drag operation starts, dragenter is always fired on the first target
  // which makes an ugly "jump" to the beginning of the list
  let skipFirstEnter = true

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

  function handleDragStart(evt, key, idx) {
    const item = evt.target.closest('li')
    dragged = {
      item,
      key,
      from: idx,
      indicator: document.createElement('span')
    }
    skipFirstEnter = true
    previousY = evt.pageY
    // this disabled the drag indicator
    evt.dataTransfer.setDragImage(dragged.indicator, 0, 0)
  }

  function handleEnter(evt, key) {
    if (dragged && dragged.key !== key && !skipFirstEnter) {
      target = { item: evt.target.closest('li'), key }
      if (previousY > evt.pageY) {
        target.item.before(dragged.item)
      } else {
        target.item.after(dragged.item)
      }
      previousY = evt.pageY
    }
    skipFirstEnter = false
  }

  function handleDrop() {
    if (dragged && target) {
      const { from, item } = dragged
      const to = Array.from(item.parentElement.children).indexOf(item)
      if (from !== to) {
        dispatch('move', { from, to })
      }
    }
    if (dragged) {
      dragged.indicator.remove()
    }
    dragged = null
    target = null
  }

  function slideOnRemove(...args) {
    // do not slide when dragging element or when clearing the list
    return dragged || keyedItems.length === 0 ? {} : slide(...args)
  }
</script>

<style lang="postcss">
  li {
    transition: margin-top 150ms linear, margin-bottom 150ms linear;

    &.dragged {
      background-color: var(--hover-bg-color);
    }
  }

  /* 
  During DnD, the first li is always hover, and we need to disable the rule
  But at the end of DnD, the item at the index of dragged element will be hovered, 
  until the mouse moved. There is no workaround.

  ol:not(.dragged) > li:hover {
    background-color: var(--hover-primary-color);
  } 
  */
</style>

<ol class:dragged>
  {#each keyedItems as item, i (item.key)}
    <li
      draggable="true"
      class:dragged={dragged && dragged.key === item.key}
      out:slideOnRemove|local={{ duration: 250 }}
      on:dragstart={evt => handleDragStart(evt, item.key, i)}
      on:dragenter={evt => handleEnter(evt, item.key)}
      on:dragend={handleDrop}
    >
      <slot name="item" {item} {i} />
    </li>
  {/each}
</ol>
