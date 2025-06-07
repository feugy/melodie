<script module lang="ts">
  import { type Snippet, onMount } from 'svelte'
  export interface StickyProps {
    class?: string
    // children can receive the floating state as single parameter.
    children?: Snippet<[boolean]>
  }
</script>

<script lang="ts">
  let { class: className, children }: StickyProps = $props()
  let sentinel: HTMLSpanElement
  let nav: HTMLElement
  let height = $state(0)
  let floating = $state(false)

  onMount(() => {
    const intersection = new IntersectionObserver((entries) => {
      floating = !entries[0].isIntersecting
    })
    intersection.observe(sentinel)

    const resize = new ResizeObserver((entries) => {
      height = entries[0].contentRect.height
    })
    resize.observe(nav)
    return () => {
      intersection.unobserve(sentinel)
      resize.unobserve(nav)
    }
  })
</script>

<span bind:this={sentinel} class="relative top-0 block h-0 w-full"></span>
<nav
  class={[
    'sticky top-0 z-100 w-full transition-colors duration-200 ease-in-out',
    className,
    floating && 'bg-primary-950/90',
  ]}
  bind:this={nav}
  style="margin-bottom: -{height}px"
>
  {@render children?.(floating)}
</nav>
