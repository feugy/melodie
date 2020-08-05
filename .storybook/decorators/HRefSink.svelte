<script>
  import { onMount } from 'svelte'
  import { action } from '@storybook/addon-actions'

  export let Component
  export let props = undefined
  export let on = {}
  let content

  function handleClick(evt) {
    const anchor = evt.target.closest('a')
    if (anchor && anchor.hasAttribute('href')) {
      const href = anchor.getAttribute('href')
      action(`navigation to`)(href)
      evt.preventDefault()
    }
  }

  onMount(() => {
    for (const event in on) {
      content.$on(event, on[event])
    }
  })
</script>

<div on:click|capture={handleClick}>
  <svelte:component this={Component} {...props} bind:this={content} />
</div>
