<script>
  import { onMount } from 'svelte'

  let sentinel
  let nav
  let height
  let floating = false

  onMount(() => {
    const intersection = new IntersectionObserver(entries => {
      floating = !entries[0].isIntersecting
    })
    intersection.observe(sentinel)

    const resize = new ResizeObserver(entries => {
      height = entries[0].contentRect.height
    })
    resize.observe(nav)
    return () => {
      intersection.unobserve(sentinel)
      resize.unobserve(nav)
    }
  })
</script>

<style lang="postcss">
  .sentinel {
    @apply block w-full h-0 relative top-0;
  }

  .floating {
    background: var(--nav-bg-color);
  }

  nav {
    @apply sticky w-full top-0;
    transition: background ease-in-out 200ms;
    z-index: 1;
  }
</style>

<span bind:this={sentinel} class="sentinel" />
<nav
  class={$$restProps.class}
  class:floating
  bind:this={nav}
  style="margin-bottom: -{height}px"
>
  <slot {floating} />
</nav>
