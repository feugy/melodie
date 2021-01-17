<script>
  import { createEventDispatcher } from 'svelte'

  export let max = 0
  export let current = 0
  const dispatch = createEventDispatcher()

  $: right = 100 - (current * 100) / (max || 1)

  function handleInput({ target: { value } }) {
    current = value
    dispatch('input', value)
  }
</script>

<style type="postcss">
  .wrapper {
    @apply relative inline-block;
    font-size: 1.2rem;
  }

  .sliderTrack {
    @apply inline-block absolute inset-x-0 pointer-events-none;
    height: 6px;
    top: calc(50% - 0.2rem);
    background: var(--hover-primary-color);
  }

  .sliderTrack,
  .progress {
    border-radius: 3px;
  }

  .progress {
    @apply absolute inset-0;
    background-color: var(--font-color);

    &::after {
      @apply absolute rounded-full inline-block bg-transparent;
      content: '';
      right: -9px;
      top: -5px;
      width: 0.8em;
      height: 0.8em;
      border: 1px solid transparent;
    }
  }

  /* TODO mobile? */
  .wrapper:hover .progress::after {
    background: var(--font-color);
    border-color: var(--bg-color);
  }

  input {
    @apply cursor-pointer align-middle;
    width: 99%;
    height: 0.3rem;
    margin-top: -0.3rem;
    -webkit-appearance: none;

    &:focus {
      @apply outline-none;
    }

    &::-webkit-slider-thumb {
      height: 1px;
      width: 1px;
      -webkit-appearance: none;
    }

    &::-moz-range-thumb {
      @apply border-none bg-transparent;
    }
  }
</style>

<div class={'wrapper ' + $$restProps.class}>
  <input
    class={$$restProps.class}
    type="range"
    min={0}
    value={current}
    {max}
    on:input={handleInput}
  />
  <div class={'sliderTrack'}>
    <span class="progress" style={`right:${right}%`} />
  </div>
</div>
