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

<style type="postcss">
  button {
    @apply inline-flex border-none cursor-pointer px-6 uppercase text-base
  font-semibold bg-transparent flex-row items-center rounded whitespace-no-wrap;
    letter-spacing: 0.05rem;
    line-height: 2.3rem;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
      color 0.2s ease-in-out, transform 0.1s linear;
    box-shadow: inset 0 0 0 1px var(--outline-color);
    /* hack to avoid setting relative on button (makes it harder to position in Dialogue) and still allow badge */
    transform: scale(1);

    &.noBorder,
    &.noBorder:hover,
    &.noBorder:active {
      @apply shadow-none;
    }

    & > i {
      font-size: 1.5rem;
    }

    &.large {
      @apply text-lg;
      line-height: 3.5rem;

      &:not(.iconOnly) {
        @apply px-8;
      }
    }

    &:focus {
      @apply outline-none;
    }

    &:hover {
      @apply outline-none;
      background-color: var(--hover-bg-color);
      transform: scale(1.03);
    }
    &:active {
      background-color: var(--hover-bg-color);
      transform: scale(0.95);
    }

    &.iconOnly {
      @apply p-2 rounded-full;

      &:hover {
        transform: scale(1.1);
      }
      &:active {
        transform: scale(0.95);
      }
      & .badge {
        font-size: 0.6rem;
        line-height: 0.6rem;
        min-width: 1.2rem;
        top: -0.25rem;
      }

      & > i {
        font-size: 1.6rem;
      }
      &.large > i {
        font-size: 2rem;
      }
    }

    &.primary {
      @apply shadow-none;
      background-color: var(--primary-color);

      /* TODO mobile? */
      &:hover,
      &:active {
        background-color: var(--hover-primary-color);
      }
    }

    &:not(.iconOnly) > i {
      margin-left: -0.3em;
      margin-right: 0.3em;
    }

    @screen md {
      & > i {
        font-size: 1rem;
      }
    }
  }

  .badge {
    @apply absolute rounded-full leading-4 text-xs p-1;
    @apply flex justify-center items-center;
    background-color: var(--hover-color);
    color: var(--bg-color);
    top: -0.5rem;
    left: -0.5rem;
    min-width: 1.5rem;
  }

  .halo::before {
    @apply absolute inline-block opacity-0 rounded-full pointer-events-none z-10;
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

<button
  class:primary
  class:iconOnly
  class:large
  class:noBorder
  {...$$restProps}
  on:click|preventDefault|stopPropagation>
  {#if icon}<i class="material-icons">{icon}</i>{/if}
  {#if text}<span>{text}</span>{/if}
  <slot />
  {#if badge !== null}
    <div class="badge" use:classOnChange={{ value: badge, className: 'halo' }}>
      {badge > 999 ? '999+' : badge}
    </div>
  {/if}
</button>
