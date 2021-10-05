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

<div on:click|capture={handleClick}>
  <slot />
</div>
