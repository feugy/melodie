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
    return !element
      ? false
      : element === menu ||
        element.getAttribute('role') === 'menu' ||
        element === button
      ? true
      : isInComponent(element.parentElement)
  }

  function select(option) {
    value = option
    handleButtonClick()
    dispatch('select', value)
  }

  function handleInteraction(evt) {
    if ((evt.target && isInComponent(evt.target)) || !open) {
      return
    }
    handleButtonClick()
  }

  function handleButtonClick() {
    open = !open
    if (!open) {
      dispatch('close')
    }
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
    if (menu.firstElementChild) {
      menu.firstElementChild.focus()
    }
  }

  function handleMenuKeyDown(evt) {
    const current = document.activeElement.closest('[role="menuitem"]')
    if (!current) {
      return
    }
    let focusable
    switch (evt.key) {
      case 'ArrowDown':
        focusable = current.nextElementSibling
        while (focusable && focusable.hasAttribute('aria-disabled')) {
          focusable = focusable.nextElementSibling
        }
        break
      case 'ArrowUp':
        focusable = current.previousElementSibling
        while (focusable && focusable.hasAttribute('aria-disabled')) {
          focusable = focusable.previousElementSibling
        }
        break
      case 'Home':
        focusable = menu.firstElementChild
        break
      case 'End':
        focusable = menu.lastElementChild
        break
      case 'Escape':
      case 'Tab':
        handleButtonClick()
        break
    }
    if (focusable) {
      focusable.focus()
      evt.preventDefault()
    }
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
    @apply p-2 whitespace-no-wrap flex items-center;

    &:not(.disabled) {
      &:hover,
      &:focus {
        @apply cursor-pointer outline-none;
        color: var(--hover-color);
        background-color: var(--hover-bg-color);
      }
    }

    &.disabled {
      color: var(--disabled-color);
    }

    & > i {
      @apply mr-2 text-base;
    }
  }
</style>

<svelte:window
  on:click|capture={handleInteraction}
  on:scroll|capture={handleInteraction} />

<span
  class="wrapper"
  bind:this={button}
  aria-haspopup="menu"
  aria-expanded={open}>
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
      role="menu"
      transition:slide
      on:introstart={handleMenuVisible}
      on:keydown={handleMenuKeyDown}
      bind:this={menu}>
      {#each options as option}
        <li
          role="menuitem"
          aria-disabled={option.disabled}
          class:disabled={option.disabled}
          tabindex={option.disabled ? undefined : -1}
          on:click={evt => {
            if (option.Component) {
              option.props.open = true
              evt.stopPropagation()
            } else {
              select(option)
            }
          }}
          on:keydown={evt => {
            if (evt.key === 'Enter' || evt.key === ' ' || evt.key === 'ArrowRight') {
              if (option.Component) {
                option.props.open = true
                evt.stopPropagation()
              } else {
                select(option)
              }
            }
          }}
          on:focus={() => (option.props ? (option.props.focus = true) : null)}
          on:blur={() => (option.props ? (option.props.focus = false) : null)}>
          {#if option.Component}
            <svelte:component
              this={option.Component}
              {...option.props}
              on:close={() => {
                option.props.open = false
                dispatch('select', option)
              }}
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
