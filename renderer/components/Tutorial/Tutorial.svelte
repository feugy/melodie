<script>
  import { afterUpdate, tick, onMount, createEventDispatcher } from 'svelte'
  import Button from '../Button/Button.svelte'

  export let anchorId
  export let top = null
  export let left = null
  export let nextButtonText = null

  const dispatch = createEventDispatcher()
  let previousAnchorId = null
  let article
  let clip = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
  let connector = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  }
  let curve = { x: 0, y: 0 }
  let margin = 20

  onMount(handleAnchorPosition)

  afterUpdate(async () => {
    await tick()
    if (anchorId !== previousAnchorId) {
      handleAnchorPosition()
      previousAnchorId = anchorId
    }
  })

  function handleAnchorPosition() {
    const anchor = document.getElementById(anchorId)
    if (!anchor || !article) {
      return
    }
    clip = anchor.getBoundingClientRect()
    const rect = article.getBoundingClientRect()

    const isAnchorAbove =
      clip.top + clip.height / 2 < rect.top + rect.height / 2
    const isAnchorLeft = clip.left + clip.width / 2 < rect.left + rect.width / 2

    connector = {
      startX: clip.left + clip.width * 0.5,
      startY: isAnchorAbove ? clip.bottom + margin : clip.top - margin,
      endX: rect.left + rect.width * (isAnchorLeft ? 0.25 : 0.75),
      endY: isAnchorAbove ? rect.top - margin : rect.bottom + margin
    }
    curve = {
      x:
        (connector.startX + connector.endX) / 2 +
        rect.width / (isAnchorLeft ? -10 : 10),
      y:
        (connector.startY + connector.endY) / 2 +
        rect.height / (isAnchorLeft ? -10 : 10)
    }
  }
</script>

<style type="postcss">
  .backdrop {
    @apply fixed flex items-center justify-center inset-0 m-0 z-10 p-10;
    clip-path: polygon(
      0% 0%,
      0% 100%,
      var(--left) 100%,
      var(--left) var(--top),
      var(--right) var(--top),
      var(--right) var(--bottom),
      var(--left) var(--bottom),
      var(--left) 100%,
      100% 100%,
      100% 0%
    );
  }

  .backdrop {
    background-color: var(--backdrop-color);
  }

  .connector {
    @apply absolute inset-0 w-full h-full;
    stroke: var(--font-color);
    stroke-linecap: round;
    stroke-width: 2;
    fill: transparent;
  }

  article {
    @apply absolute;
    font-family: 'Permanent Marker';
    max-width: 50%;
    max-height: 25%;
  }
</style>

<svelte:window on:resize={handleAnchorPosition} />

<div
  class="backdrop"
  style="--top:{clip.top}px; --right:{clip.right}px; --bottom:{clip.bottom}px; --left:{clip.left}px;">
  <svg class="connector">
    <path
      d="M {connector.startX} {connector.startY} Q {curve.x} {curve.y} {connector.endX} {connector.endY}" />
  </svg>
  <article style="top: {top}; left: {left};" bind:this={article}>
    <slot />
    {#if nextButtonText}
      <Button
        text={nextButtonText}
        icon="navigate_next"
        on:click={() => dispatch('next')}
        primary="true" />
    {/if}
  </article>
</div>
