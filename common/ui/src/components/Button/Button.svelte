<script>
  import { classOnChange } from '../../actions'

  export let text = null
  export let primary = false
  export let icon = null
  export let large = false
  export let noBorder = false
  export let badge = null

  $: iconOnly = !text
</script>

<button
  class:primary
  class:iconOnly
  class:large
  class:noBorder
  {...$$restProps}
  on:click|stopPropagation
>
  {#if icon}<i class="icons {icon}" />{/if}
  {#if text}<span>{text}</span>{/if}
  <slot />
  {#if badge !== null}
    <div class="badge" use:classOnChange={{ value: badge, className: 'halo' }}>
      {badge > 999 ? '999+' : badge}
    </div>
  {/if}
</button>

<style>
  button {
    --at-apply: inline-flex border-none cursor-pointer px-6 uppercase text-base
      font-semibold bg-transparent flex-row items-center rounded
      whitespace-nowrap;
    letter-spacing: 0.05rem;
    line-height: 2.3rem;
    transition:
      background-color 0.2s ease-in-out,
      box-shadow 0.2s ease-in-out,
      color 0.2s ease-in-out,
      transform 0.1s linear;
    box-shadow: inset 0 0 0 1px var(--outline-color);
    /* hack to avoid setting relative on button (makes it harder to position in Dialogue) and still allow badge */
    transform: scale(1);

    &.noBorder,
    &.noBorder:hover,
    &.noBorder:active {
      --at-apply: shadow-none;
    }

    &:disabled {
      --at-apply: cursor-default;
      color: var(--disabled-color);
    }

    & > i {
      font-size: 'inherit';
    }

    &.large {
      --at-apply: text-lg;
      line-height: 3.5rem;

      &:not(.iconOnly) {
        --at-apply: px-8;
      }
    }

    &:focus {
      --at-apply: outline-none;
    }

    &:hover:not(:disabled),
    &:focus:not(:disabled) {
      --at-apply: outline-none;
      background-color: var(--hover-bg-color);
      transform: scale(1.03);
    }
    &:active:not(:disabled) {
      background-color: var(--hover-bg-color);
      transform: scale(0.95);
    }

    &.iconOnly {
      --at-apply: p-2 rounded-full;

      &:hover:not(:disabled),
      &:focus:not(:disabled) {
        transform: scale(1.1);
      }
      &:active:not(:disabled) {
        transform: scale(0.95);
      }
      & .badge {
        font-size: 0.6rem;
        line-height: 0.6rem;
        min-width: 1.2rem;
        top: -0.25rem;
      }

      & > i {
        font-size: 'inherit';
      }
      &.large > i {
        font-size: 1.8rem;
      }
    }

    &.primary {
      --at-apply: shadow-none;
      background-color: var(--primary-color);

      /* TODO mobile? */
      &:hover:not(:disabled),
      &:focus:not(:disabled),
      &:active:not(:disabled) {
        background-color: var(--hover-primary-color);
      }
    }

    &:not(.iconOnly) > i {
      margin-left: -0.3em;
      margin-right: 0.3em;
    }
  }

  .badge {
    --at-apply: absolute rounded-full leading-4 text-xs p-1;
    --at-apply: flex justify-center items-center;
    background-color: var(--hover-color);
    color: var(--bg-color);
    top: -0.5rem;
    left: -0.5rem;
    min-width: 1.5rem;
  }

  .halo::before {
    --at-apply: absolute inline-block opacity-0 rounded-full pointer-events-none
      z-10;
    content: '';
    border: 1px solid var(--hover-color);
    animation: ripple 0.5s ease-in;
  }

  @keyframes ripple {
    0% {
      height: 100%;
      width: 100%;
      opacity: 0;
    }
    75% {
      height: 500%;
      width: 500%;
      opacity: 0.75;
    }
    100% {
      height: 1000%;
      width: 1000%;
      opacity: 0;
    }
  }
</style>
