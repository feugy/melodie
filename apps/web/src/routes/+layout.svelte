<script lang="ts">
  import { browser } from '$app/environment'
  import { page } from '$app/state'
  import type { Snippet } from 'svelte'
  import '../app.css'
  import { MD, screen } from '$lib/client'
  import { configureLocales } from '$lib/utils'

  configureLocales(page.params.locale)
  let { children }: { children: Snippet } = $props()

  if (browser) {
    // adjust overall text scale on small screens
    document.documentElement.style.setProperty(
      '--text-scaling',
      `${screen.size < MD ? 0.8 : 1}`
    )
  }
</script>

<svelte:head></svelte:head>

{@render children?.()}
