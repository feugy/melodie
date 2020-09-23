<script context="module">
  import { BehaviorSubject } from 'rxjs'

  const isMoveInProgress$ = new BehaviorSubject(false)
  export const isMoveInProgress = isMoveInProgress$.asObservable()
</script>

<script>
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'
  import { _ } from 'svelte-intl'

  export let items = []

  const dispatch = createEventDispatcher()
  let dragged = null
  let target = null
  let keyedItems = []
  let possibleDrag = null

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

  function findPositionned(node) {
    return !node
      ? null
      : node.offsetParent &&
        getComputedStyle(node.offsetParent).position !== 'static'
      ? node.offsetParent
      : findPositionned(node.offsetParent)
  }

  function handleDrag(evt, key, idx) {
    const item = evt.target.closest('li')
    const bounds = item.parentNode.getBoundingClientRect()
    const { height, width, left, top } = item.getBoundingClientRect()
    possibleDrag = {
      item,
      key,
      idx,
      offset: top - evt.clientY,
      height,
      width,
      left,
      min: bounds.top,
      max: bounds.bottom - height,
      positionned: findPositionned(item)
    }
    if (possibleDrag.positionned) {
      const { left, top } = possibleDrag.positionned.getBoundingClientRect()
      possibleDrag.left -= left
      possibleDrag.offset -= top
    }
  }

  function handleOver(evt, key, idx) {
    if (dragged) {
      if (target) {
        target.item.style.marginTop = null
        target.item.style.marginBottom = null
      }
      target = { item: evt.target.closest('li'), key, idx }
      target.item.before(dragged.item)
      target.item.style.marginTop = `${dragged.height}px`
    }
  }

  function handleOut() {
    if (
      dragged &&
      target &&
      target.key === keyedItems[keyedItems.length - 1].key
    ) {
      target.idx++
      target.item.after(dragged.item)
      target.item.style.marginTop = null
      target.item.style.marginBottom = `${dragged.height}px`
    }
  }

  function handleMove(evt) {
    if (possibleDrag) {
      dragged = possibleDrag
      dragged.item.style.left = `${dragged.left}px`
      dragged.item.style.height = `${dragged.height}px`
      dragged.item.style.width = `${dragged.width}px`
      possibleDrag = null
      handleOver(evt, dragged.key, dragged.idx)
      isMoveInProgress$.next(true)
    }
    if (dragged) {
      const value =
        evt.clientY +
        dragged.offset +
        (dragged.positionned ? dragged.positionned.scrollTop : 0)
      dragged.item.style.top = `${
        value < dragged.min
          ? dragged.min
          : value > dragged.max
          ? dragged.max
          : value
      }px`
    }
  }

  function handleDrop() {
    if (target) {
      target.item.style.marginTop = null
      target.item.style.marginBottom = null
    }
    if (dragged && target) {
      const from = dragged.idx
      const to = target.idx - (from < target.idx ? 1 : 0)
      if (from !== to) {
        dispatch('move', { from, to })
      }
    }
    possibleDrag = null
    dragged = null
    target = null
    isMoveInProgress$.next(false)
  }

  function slideOnRemove(...args) {
    return dragged ? {} : slide(...args)
  }
</script>

<style type="postcss">
  li {
    transition: margin-top 150ms linear, margin-bottom 150ms linear;
  }

  li.dragged {
    @apply absolute inline-block pointer-events-none;
    background: var(--hover-bg-color);
    transition: top 150ms linear;
  }

  ol.dragged {
    @apply cursor-move;
  }
</style>

<svelte:body on:mousemove={handleMove} on:mouseup={handleDrop} />
<ol on:mouseleave={handleOut} class:dragged>
  {#each keyedItems as item, i (item.key)}
    <li
      out:slideOnRemove|local={{ duration: 250 }}
      class:dragged={dragged && dragged.key === item.key}
      class:target={target && target.key === item.key}
      on:mousedown={evt => handleDrag(evt, item.key, i)}
      on:mouseenter={evt => handleOver(evt, item.key, i)}>
      <slot name="item" {item} {i} />
    </li>
  {/each}
</ol>
