<script context="module">
  const selector =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')
      ? 'focus'
      : 'focus-within'
</script>

<script>
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'
  import Portal from 'svelte-portal'

  import Button from '../Button/Button.svelte'

  export let value = null
  export let options = []
  export let valueAsText = true
  export let withArrow = true
  /** @type {string|null} */
  export let text = null
  export let open = false

  const dispatch = createEventDispatcher()
  let ref
  let anchor

  $: iconOnly = !valueAsText && !text
  $: if (!value && options.length) {
    value = options[0]
  }
  $: if (valueAsText) {
    text = value ? value.label || value : text
  }
  $: if (open) {
    handleVisible()
  }

  function isInComponent(element) {
    return !element
      ? false
      : element === ref ||
          (element.getAttribute && element.getAttribute('role') === 'menu') ||
          element === anchor
        ? true
        : isInComponent(element.parentElement)
  }

  function select(option) {
    value = option
    dispatch('select', value)
    toggleVisibility()
  }

  function toggleVisibility() {
    open = !open
    if (!open) {
      dispatch('close')
    }
  }

  function handleInteraction(evt) {
    if ((evt.target && isInComponent(evt.target)) || !open) {
      return
    }
    toggleVisibility()
  }

  async function handleVisible() {
    if (!ref || !anchor) {
      return
    }
    const sav = ref.getAttribute('style')
    // reset styling to get final menu dimension
    ref.setAttribute('style', '')
    const anchorDim = anchor.getBoundingClientRect()
    const { width: menuWidth, height: menuHeight } = ref.getBoundingClientRect()
    const { innerWidth, innerHeight } = window
    // restore styling to resume anumations
    ref.setAttribute('style', sav)

    const minWidth = anchorDim.width
    let top = anchorDim.bottom
    let left =
      anchorDim.left +
      (anchorDim.width - Math.max(menuWidth, anchorDim.width)) / 2

    let right = null
    let bottom = null
    if (left + Math.max(menuWidth, minWidth) > innerWidth) {
      left = null
      right = innerWidth - anchorDim.right
    } else if (left < 0) {
      left = anchorDim.left
    }
    if (
      anchorDim.top - menuHeight >= 0 &&
      innerHeight < anchorDim.bottom + menuHeight
    ) {
      top = null
      bottom = innerHeight - anchorDim.top
    }
    Object.assign(ref.style, {
      top: top !== null ? `${top}px` : '',
      left: left !== null ? `${left}px` : '',
      right: right !== null ? `${right}px` : '',
      bottom: bottom !== null ? `${bottom}px` : '',
      minWidth: `${minWidth}px`
    })
    if (ref.children.length) {
      const idx = options.indexOf(value)
      if (idx >= 0 && !value.disabled) {
        ref.children.item(idx).focus()
      } else {
        handleFocus(null, true)
      }
    }
  }

  function handleBlur() {
    setTimeout(() => {
      if (!isInComponent(document.activeElement) && open) {
        toggleVisibility()
      }
    }, 0)
  }

  function handleMenuKeyDown(evt) {
    switch (evt.key) {
      case 'ArrowDown':
        handleFocus(evt, true)
        break
      case 'ArrowUp':
        handleFocus(evt, false)
        break
      case 'Home':
        document.activeElement && document.activeElement.blur()
        handleFocus(evt, true)
        break
      case 'End':
        document.activeElement && document.activeElement.blur()
        handleFocus(evt, false)
        break
      case 'Escape':
        toggleVisibility()
        break
    }
  }

  function handleItemKeyDown(evt, option) {
    if (evt.key === 'Enter' || evt.key === ' ' || evt.key === 'ArrowRight') {
      handleItemClick(evt, option)
    }
  }

  function handleItemClick(evt, option) {
    if (option.Component) {
      option.props.open = true
      // blur to let sub component take the focus
      document.activeElement.blur()
      evt.target.focus()
      evt.stopPropagation()
    } else if (option && !option.disabled) {
      select(option)
    }
  }

  function handleFocus(evt, next) {
    const prop = next ? 'nextElementSibling' : 'previousElementSibling'
    let focusable
    let current = ref.querySelector(`[role="menuitem"]:${selector}`)
    if (current) {
      focusable = current[prop]
    } else {
      focusable = ref[next ? 'firstElementChild' : 'lastElementChild']
    }
    // note that JSDom does not support focusable?.ariaDisabled === 'true'
    while (focusable && focusable.getAttribute('aria-disabled') === 'true') {
      focusable = focusable[prop]
    }
    if (focusable) {
      focusable.focus()
      evt && evt.preventDefault()
    }
  }
</script>

<svelte:window on:resize|capture={handleVisible} />

<span
  class="wrapper"
  bind:this={anchor}
  aria-haspopup="menu"
  aria-expanded={open}
>
  <Button {...$$restProps} {text} on:click={toggleVisibility}>
    {#if withArrow}
      <i class:iconOnly class="icons arrow i-mdi-menu-{open ? 'up' : 'down'}" />
    {/if}
  </Button>
</span>
{#if open && anchor && options && options.length}
  <Portal target="body">
    <ul
      role="menu"
      tabindex="-1"
      transition:slide
      on:introstart={handleVisible}
      on:keydown={handleMenuKeyDown}
      on:focus={evt => handleFocus(evt, ref.dataset.focusNext !== 'false')}
      on:focusout={evt => handleBlur(evt)}
      bind:this={ref}
    >
      {#each options as option}
        <li
          role="menuitem"
          aria-disabled={option.disabled}
          class:disabled={option.disabled}
          class:current={option === value}
          tabindex={option.disabled ? undefined : -1}
          on:click={evt => handleItemClick(evt, option)}
          on:keydown={evt => handleItemKeyDown(evt, option)}
          on:focus={() => (option.props ? (option.props.focus = true) : null)}
          on:blur={() => (option.props ? (option.props.focus = false) : null)}
        >
          {#if option.Component}
            <svelte:component
              this={option.Component}
              {...option.props}
              on:close={() => {
                option.props.open = false
                dispatch('select', option)
              }}
              on:close={handleInteraction}
            />
          {:else}
            {#if option.icon}<i class="icons {option.icon}" />{/if}
            {option.label || option}
          {/if}
        </li>
      {/each}
    </ul>
  </Portal>
{/if}

<style>
  .wrapper {
    --at-apply: inline-block;
  }

  .arrow {
    --at-apply: ml-2;

    &:not(.iconOnly) {
      --at-apply: -mr-4 ml-1;
    }
  }

  ul {
    --at-apply: absolute my-3 rounded z-20 text-sm;
    background-color: var(--bg-primary-color);
    border: 1px solid var(--outline-color);
  }

  li {
    --at-apply: p-2 whitespace-nowrap flex items-center;

    &:not(.disabled) {
      &:hover,
      &:focus {
        --at-apply: cursor-pointer outline-none;
        color: var(--hover-color);
        background-color: var(--hover-bg-color);
      }
      &.current {
        color: var(--hover-color);
        background-color: var(--outline-color);
      }
    }

    &.disabled {
      color: var(--disabled-color);
    }

    & > i {
      --at-apply: mr-2 text-base;
    }
  }
</style>
