<script>
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'
  import Button from '../Button/Button.svelte'

  export let value
  export let options
  export let valueAsText = true
  export let withArrow = true
  export let text = null

  const dispatch = createEventDispatcher()
  let open = false
  let menu
  let button

  $: iconOnly = !valueAsText && !text
  $: if (!value && options.length) {
    value = options[0]
  }
  $: if (valueAsText) {
    text = value ? value.label || value : text
  }

  function handleSelect(selected) {
    value = selected
    open = false
    dispatch('select', value)
  }

  function handleInteraction() {
    open = false
  }

  function handleButtonClick() {
    open = !open
  }

  async function handleMenuVisible() {
    const sav = menu.getAttribute('style')
    // reset styling to get final menu dimension
    menu.setAttribute('style', '')
    const position = button.getBoundingClientRect()
    const visible = document.body.getBoundingClientRect()
    const dim = menu.getBoundingClientRect()
    // restore styling to resume anumations
    menu.setAttribute('style', sav)

    const minWidth = `${position.width}px`
    let top = `${position.bottom}px`
    let left = `${
      position.left + (position.width - Math.max(dim.width, position.width)) / 2
    }px`
    let right
    let bottom
    if (visible.right < dim.right) {
      left = ''
      right = `${visible.right - position.right}px`
    } else if (visible.left > dim.left) {
      left = `${position.left}px`
    }
    if (
      position.top - dim.height >= 0 &&
      visible.bottom < position.bottom + dim.height
    ) {
      top = ''
      bottom = `${visible.bottom - position.top}px`
    }
    Object.assign(menu.style, { top, left, right, bottom, minWidth })
  }
</script>

<style type="postcss">
  .wrapper {
    @apply inline-flex flex-col items-center;
  }

  .arrow {
    @apply ml-2;
  }

  .arrow:not(.iconOnly) {
    @apply -mr-4;
  }

  ul {
    @apply absolute my-3 rounded z-10 text-sm;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);
  }

  li {
    @apply px-4 py-2 cursor-pointer whitespace-no-wrap flex items-center;
  }

  li:hover {
    color: var(--hover-color);
    background-color: var(--hover-bg-color);
  }

  li > i {
    @apply mr-2 text-base;
  }
</style>

<svelte:window
  on:click|capture={handleInteraction}
  on:scroll|capture={handleInteraction} />

<span class="wrapper" bind:this={button}>
  <Button {...$$props} {text} on:click={handleButtonClick}>
    {#if withArrow}
      <i class:iconOnly class="material-icons arrow">
        {`arrow_drop_${open ? 'up' : 'down'}`}
      </i>
    {/if}
  </Button>
  {#if open}
    <ul transition:slide on:introstart={handleMenuVisible} bind:this={menu}>
      {#each options as option}
        <li on:click={() => handleSelect(option)}>
          {#if option.icon}
            <i class="material-icons">{option.icon}</i>
          {/if}
          {option.label || option}
        </li>
      {/each}
    </ul>
  {/if}
</span>
