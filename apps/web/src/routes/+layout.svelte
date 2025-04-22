<script lang="ts">
  import { page } from '$app/state'
  import type { Snippet } from 'svelte'
  import '../app.css'
  import { configureLocales } from '$lib/utils'

  configureLocales(page.params.locale)
  let { children }: { children: Snippet } = $props()
</script>

<svelte:head></svelte:head>

{@render children?.()}
