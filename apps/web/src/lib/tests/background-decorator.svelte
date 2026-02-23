<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, className }: { children?: Snippet; className?: string } =
    $props()
</script>

<div class={className}>
  {@render children?.()}
</div>
