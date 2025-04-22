<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    class: className = '',
    children,
  }: { class?: string; children?: Snippet } = $props()
</script>

<header class="sticky top-0 z-10">
  <h1 class="text-primary-contrast-800-200 h3 p-2 {className}">
    {@render children?.()}
  </h1>
</header>
