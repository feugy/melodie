<script>
  import { classOnChange } from '../../utils'

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
    @apply inline-flex border-none cursor-pointer px-6 uppercase text-sm
  font-semibold bg-transparent flex-row items-center rounded whitespace-no-wrap;
    letter-spacing: 0.1rem;
    line-height: 2.8rem;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
      color 0.2s ease-in-out, transform 0.1s linear;
    box-shadow: inset 0 0 0 2px var(--outline-color);
    /* hack to avoid setting relative on button (makes it harder to position in Dialogue) and still allow badge */
    transform: scale(1);
  }

  button:focus {
    @apply outline-none;
  }

  button.noBorder,
  button.noBorder:hover,
  button.noBorder:active {
    @apply shadow-none;
  }

  button.large {
    @apply text-lg;
    line-height: 4rem;
  }

  button > i {
    font-size: 150%;
  }

  button.large:not(.iconOnly) {
    @apply px-8;
  }

  .primary {
    @apply shadow-none;
    background-color: var(--primary-color);
  }

  button:hover,
  button:active {
    background-color: var(--hover-bg-color);
  }

  button.primary:hover,
  button.primary:active {
    background-color: var(--hover-primary-color);
  }

  button:hover {
    transform: scale(1.05);
  }
  button:active {
    transform: scale(0.95);
  }

  :not(.iconOnly) > i {
    margin-left: -0.3em;
    margin-right: 0.3em;
  }

  .iconOnly {
    @apply p-2 rounded-full;
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

  .halo:before {
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
  data-testid={$$props['data-testid']}
  class={$$props.class}
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
