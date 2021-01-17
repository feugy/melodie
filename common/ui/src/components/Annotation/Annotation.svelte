<script>
  import { onMount } from 'svelte'

  export let anchor
  export let top = null
  export let left = null
  export let margin = 20

  let tracking = false
  let article
  let articleRect = { top: 0, left: 0, bottom: 0, right: 0 }
  let clip = null
  let connector = null
  let curve = null

  onMount(() => {
    reset()
    tracking = true
    window.requestAnimationFrame(handleFrame)
    return () => {
      tracking = false
    }
  })

  function reset() {
    articleRect = { top: 0, left: 0, bottom: 0, right: 0 }
    clip = null
    connector = null
    curve = null
  }

  function handleFrame() {
    if (!tracking) {
      reset()
      return
    }
    window.requestAnimationFrame(handleFrame)
    if (!anchor || !article) {
      reset()
      return
    }
    const newClip = anchor.getBoundingClientRect()
    const rect = article.getBoundingClientRect()
    if (
      articleRect &&
      clip &&
      rect.top === articleRect.top &&
      rect.bottom === articleRect.bottom &&
      rect.left === articleRect.left &&
      rect.right === articleRect.right &&
      newClip.top === clip.top &&
      newClip.bottom === clip.bottom &&
      newClip.left === clip.left &&
      newClip.right === clip.right
    ) {
      return
    }
    if (newClip.width === 0 && newClip.height === 0) {
      // invisible anchor
      reset()
      return
    }
    clip = newClip
    articleRect = rect

    const isAbove = clip.bottom < rect.top
    const isBellow = clip.top > rect.bottom
    const isLeft = clip.right < rect.left + rect.width * 0.3
    const isRight = clip.left > rect.right - rect.width * 0.3
    const isLastThird = clip.left > rect.left + rect.width * 0.5

    connector = {
      startX:
        (isAbove || isBellow) && (isLeft || isRight)
          ? clip.left + clip.width * 0.5
          : isLastThird || (!isAbove && !isBellow && isRight)
          ? clip.left - margin
          : clip.right + margin,
      startY:
        (!isAbove && !isBellow) || (!isLeft && !isRight)
          ? clip.top + clip.height * 0.5
          : isAbove
          ? clip.bottom + margin
          : clip.top - margin,
      endX: isLeft
        ? rect.left - margin
        : isRight
        ? rect.right + margin
        : isLastThird
        ? rect.left + rect.width * 0.25
        : rect.left + rect.width * 0.75,
      endY:
        isAbove && !isLeft && !isRight
          ? rect.top - margin
          : isBellow && !isLeft && !isRight
          ? rect.bottom + margin
          : rect.top + rect.height * 0.5
    }

    curve =
      !isLeft && !isRight
        ? {
            x: connector.endX - (connector.endX - connector.startX) * 0.3,
            y: connector.startY - (connector.startY - connector.endY) * 0.3
          }
        : !isAbove && !isBellow
        ? {
            x: connector.endX - (connector.endX - connector.startX) * 0.5,
            y: connector.startY
          }
        : {
            x: connector.startX - (connector.startX - connector.endX) * 0.3,
            y: connector.endY - (connector.endY - connector.startY) * 0.3
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
    max-width: 35%;
    max-height: 25%;
  }
</style>

<div
  class="backdrop"
  style={clip
    ? `--top:${clip.top}px; --right:${clip.right}px; --bottom:${clip.bottom}px; --left:${clip.left}px;`
    : ''}
>
  {#if connector}
    <svg class="connector">
      <path
        d="M {connector.startX} {connector.startY} Q {curve.x} {curve.y} {connector.endX} {connector.endY}"
      />
    </svg>
  {/if}
  <article style="top: {top}; left: {left};" bind:this={article}>
    <slot />
  </article>
</div>
