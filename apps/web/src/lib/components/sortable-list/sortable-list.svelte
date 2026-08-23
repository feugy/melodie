<script module lang="ts">
  export interface SortableListProps<Item extends { id: number }> {
    items: Item[]
    item: Snippet<[{ item: Item; index: number }]>
    onmove?: (args: { from: number; to: number }) => unknown
  }

  interface Dragged {
    node: HTMLElement
    offset: number
    key: string
    height: number
    from: number
    to: number
  }

  function getDraggedNode(event: PointerEvent) {
    const source = event.target as HTMLElement
    const sourceName = source.tagName
    const node = source.closest('li')
    if (sourceName === 'IMG') {
      // prevent dragging images
      event.preventDefault()
    }
    // do note drag item when clicking on the removal button
    const button = source.closest('button')
    return button?.dataset.testid?.startsWith('remove-') || !node ? null : node
  }
</script>

<script lang="ts" generics="Item extends { id: number}">
  import { screen } from '$lib/client'
  import { type Snippet } from 'svelte'
  import { slide } from 'svelte/transition'
  import GripIcon from '@lucide/svelte/icons/grip-vertical'

  let { items, item: itemSnippet, onmove }: SortableListProps<Item> = $props()

  let dragged = $state<Dragged | null>(null)
  let candidate = $state<Dragged | null>(null)
  let previousY = $state(0)
  let preventClick = $state(false)
  let keyedItems = $derived.by(() => {
    // ensure items have unique keys: same item could appear multiple times in the list
    const unique = new Map()
    const keyedItems = []
    for (const item of items) {
      let num = unique.get(item.id) || 0
      unique.set(item.id, ++num)
      keyedItems.push({ ...item, key: `${item.id}-${num}` })
    }
    return keyedItems
  })

  function handleDrag(evt: PointerEvent, key: string, idx: number) {
    const node = getDraggedNode(evt)
    if (!node) return

    candidate = {
      node,
      key,
      from: idx,
      to: idx,
      height: node.getBoundingClientRect().height,
      offset: evt.pageY + node.offsetTop - node.getBoundingClientRect().top,
    }
    previousY = evt.pageY
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleDrop, { once: true })
    document.body.addEventListener('pointerleave', handleDrop, { once: true })
  }

  function updateDragged(
    evt: PointerEvent,
    to: number,
    sibling: HTMLElement | undefined
  ) {
    if (!dragged || !sibling || sibling === dragged.node) {
      return
    }
    if (previousY < evt.pageY) {
      sibling.style.top = dragged.from < to ? `-${dragged.height}px` : '0px'
      dragged.to = dragged.from < to ? to : to + 1
    } else {
      sibling.style.top = dragged.from < to ? '0px' : `${dragged.height}px`
      dragged.to = dragged.from < to ? to - 1 : to
    }
    dragged.node.style.top = `${dragged.height * (dragged.to - dragged.from)}px`
    previousY = evt.pageY
  }

  function handleEnter(evt: PointerEvent, key: string) {
    if (screen.supportHover) {
      if (dragged && dragged.key !== key) {
        const sibling = (evt.target as HTMLElement).closest('li') as HTMLElement
        const to = Array.from(sibling.parentElement?.children ?? []).indexOf(
          sibling
        )
        updateDragged(evt, to, sibling)
      }
    } else if (dragged?.key === key) {
      const list = Array.from(
        (dragged.node.parentElement?.children as HTMLElement[] | undefined) ??
          []
      )
      let sibling: HTMLElement | undefined
      let to = dragged.from
      const direction = previousY < evt.pageY ? 1 : -1
      for (let i = dragged.to; i < list.length && i >= 0; i += direction) {
        const { top } = list[i].getBoundingClientRect()
        if (top <= evt.pageY && evt.pageY < top + dragged.height) {
          sibling = list[i]
          to = i
          break
        }
      }
      updateDragged(evt, to, sibling)
    }
  }

  function handleMove() {
    if (candidate) {
      dragged = candidate
      candidate = null
    }
  }

  function handleDrop() {
    window.removeEventListener('pointermove', handleMove)
    if (dragged) {
      const { from, node, to } = dragged
      for (const child of node.parentElement?.children ?? []) {
        ;(child as HTMLElement).style.top = ''
      }
      if (from !== to) {
        preventClick = true
        onmove?.({ from, to })
      }
    }
    dragged = null
  }

  function slideOnRemove(...args: Parameters<typeof slide>) {
    // do not slide when dragging element or when clearing the list
    return dragged || keyedItems.length === 0 ? {} : slide(...args)
  }

  function handleClick(evt: MouseEvent) {
    if (preventClick) {
      evt.stopPropagation()
    }
    preventClick = false
  }
</script>

<ol class:touch-none={Boolean(dragged)} onclickcapture={handleClick}>
  {#each keyedItems as item, i (item.key)}
    {@const isDragged = dragged?.key === item.key}
    <li
      class:pointer-events-none={isDragged}
      class:preset-filled={isDragged}
      class="relative flex transform-gpu transition-[top] [&_*]:cursor-grab"
      onpointerdown={(evt) =>
        screen.supportHover ? handleDrag(evt, item.key, i) : void 0}
      onpointermove={(evt) => handleEnter(evt, item.key)}
      out:slideOnRemove={{ duration: 250 }}
    >
      {#if !screen.supportHover}
        <div
          class="text-surface-700 flex cursor-grabbing touch-none justify-center items-center self-stretch w-10"
          onpointerdown={(evt) => handleDrag(evt, item.key, i)}
          role="separator"
        >
          <GripIcon />
        </div>
      {/if}
      <div class="flex-1 touch-auto">
        {@render itemSnippet({ item, index: i })}
      </div>
    </li>
  {/each}
</ol>
