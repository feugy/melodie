<script lang="ts">
  import type { Snippet } from 'svelte'

  interface HeadingProps {
    class?: string
    children?: Snippet
  }

  let { class: className, children }: HeadingProps = $props()
</script>

<header>
  <h1
    class={[
      'text-primary-500 h3 border-primary-500 mx-4 mt-16 mb-2 border-0 border-b-1',
      className,
    ]}
  >
    {@render children?.()}
  </h1>
</header>
