<script>
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Slider from '../Slider/Slider.svelte'

  export let volume = 1
  export let muted = false
  $: volumePct = volume * 100
</script>

<style type="postcss">
  div {
    @apply flex flex-row items-center justify-end mr-0 flex-grow;
  }

  span {
    @apply pr-2 inline-block flex-grow;
  }

  @screen md {
    span {
      max-width: 100px;
    }
  }
</style>

<div>
  <span class="volume-slider">
    <Slider
      class="w-full"
      current={volumePct}
      max={100}
      on:input={({ detail: v }) => {
        if (v != null) {
          volume = v / 100
        }
      }}
    />
  </span>
  <Button
    on:click={() => (muted = !muted)}
    icon={muted ? 'volume_off' : 'volume_up'}
    noBorder
  />
</div>
