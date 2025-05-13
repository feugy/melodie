<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, color }: { children?: Snippet; color?: string } = $props()
</script>

<div class={color}>
  {@render children?.()}
</div>
