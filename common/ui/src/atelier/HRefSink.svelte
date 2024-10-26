<script>
  import { recordEvent } from '@atelier-wb/svelte'

  function handleClick(evt) {
    const anchor = evt.target.closest('a')
    if (anchor && anchor.hasAttribute('href')) {
      const href = anchor.getAttribute('href')
      recordEvent('browse', href)
      evt.preventDefault()
    }
  }
</script>

<!-- TODO Fix svelte warnings -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click|capture={handleClick}>
  <slot />
</div>
