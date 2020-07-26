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
  }

  .sliderTrack {
    @apply inline-block absolute inset-x-0 pointer-events-none;
    top: 15px;
    height: 6px;
    background: var(--font-color);
  }

  .sliderTrack,
  .progress {
    border-radius: 3px;
  }

  .progress {
    @apply absolute inset-0;
    background-color: var(--hover-primary-color);
  }

  .wrapper:hover .progress::after {
    background: var(--font-color);
    border-color: var(--bg-color);
  }

  .progress::after {
    @apply absolute rounded-full inline-block bg-transparent;
    content: '';
    right: -9px;
    top: -5px;
    width: 0.8em;
    height: 0.8em;
    border: 1px solid transparent;
  }

  input {
    @apply cursor-pointer align-middle;
    width: 99%;
    height: 5px;
    -webkit-appearance: none;
  }

  input:focus {
    @apply outline-none;
  }

  input::-webkit-slider-thumb {
    height: 1px;
    width: 1px;
    -webkit-appearance: none;
  }

  input::-moz-range-thumb {
    @apply border-none bg-transparent;
  }
</style>

<div class={'wrapper ' + $$props.class}>
  <input
    class={$$props.class}
    type="range"
    min={0}
    value={current}
    {max}
    on:input={handleInput} />
  <div class={'sliderTrack'}>
    <span class="progress" style={`right:${right}%`} />
  </div>
</div>
