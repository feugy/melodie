<script>
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'
  import Portal from 'svelte-portal'
  import Button from '../Button/Button.svelte'

  export let value
  export let options
  export let valueAsText = true
  export let withArrow = true
  export let text = null
  export let open = false

  const dispatch = createEventDispatcher()
  let menu
  let button

  $: iconOnly = !valueAsText && !text
  $: if (!value && options.length) {
    value = options[0]
  }
  $: if (valueAsText) {
    text = value ? value.label || value : text
  }

  function isInComponent(element) {
    const parent = element.parentElement
    return !parent
      ? false
      : parent === menu || parent === button || parent.dataset.isMenu
      ? true
      : isInComponent(parent)
  }

  function handleSelect(selected) {
    value = selected
    open = false
    dispatch('select', value)
  }

  function handleInteraction(evt) {
    if (evt.target && isInComponent(evt.target)) {
      return
    }
    open = false
  }

  function handleButtonClick() {
    open = !open
  }

  async function handleMenuVisible() {
    const sav = menu.getAttribute('style')
    // reset styling to get final menu dimension
    menu.setAttribute('style', '')
    const buttonDim = button.getBoundingClientRect()
    const {
      width: menuWidth,
      height: menuHeight
    } = menu.getBoundingClientRect()
    const { innerWidth, innerHeight } = window
    // restore styling to resume anumations
    menu.setAttribute('style', sav)

    const minWidth = buttonDim.width
    let top = buttonDim.bottom
    let left =
      buttonDim.left +
      (buttonDim.width - Math.max(menuWidth, buttonDim.width)) / 2

    let right = null
    let bottom = null
    if (left + Math.max(menuWidth, minWidth) > innerWidth) {
      left = null
      right = innerWidth - buttonDim.right
    } else if (left < 0) {
      left = buttonDim.left
    }
    if (
      buttonDim.top - menuHeight >= 0 &&
      innerHeight < buttonDim.bottom + menuHeight
    ) {
      top = null
      bottom = innerHeight - buttonDim.top
    }
    Object.assign(menu.style, {
      top: top !== null ? `${top}px` : '',
      left: left !== null ? `${left}px` : '',
      right: right !== null ? `${right}px` : '',
      bottom: bottom !== null ? `${bottom}px` : '',
      minWidth: `${minWidth}px`
    })
  }
</script>

<style type="postcss">
  .wrapper {
    @apply inline-block;
  }

  .arrow {
    @apply ml-2;

    &:not(.iconOnly) {
      @apply -mr-4;
    }
  }

  ul {
    @apply absolute my-3 rounded z-20 text-sm;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);
  }

  li {
    @apply px-4 py-2 cursor-pointer whitespace-no-wrap flex items-center;

    &:hover {
      color: var(--hover-color);
      background-color: var(--hover-bg-color);
    }

    & > i {
      @apply mr-2 text-base;
    }
  }
</style>

<svelte:window
  on:click|capture={handleInteraction}
  on:scroll|capture={handleInteraction} />

<span class="wrapper" bind:this={button}>
  <Button {...$$restProps} {text} on:click={handleButtonClick}>
    {#if withArrow}
      <i class:iconOnly class="material-icons arrow">
        {`arrow_drop_${open ? 'up' : 'down'}`}
      </i>
    {/if}
  </Button>
</span>
<Portal>
  {#if open}
    <ul
      data-is-menu="true"
      transition:slide
      on:introstart={handleMenuVisible}
      bind:this={menu}>
      {#each options as option}
        <li
          on:click={evt => {
            if (option.Component) {
              evt.stopPropagation()
            } else {
              handleSelect(option)
            }
          }}>
          {#if option.Component}
            <svelte:component
              this={option.Component}
              {...option.props}
              on:close={() => dispatch('select', option)}
              on:close={handleInteraction} />
          {:else}
            {#if option.icon}<i class="material-icons">{option.icon}</i>{/if}
            {option.label || option}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</Portal>
