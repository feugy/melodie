<script>
  import Button from '../Button/Button.svelte'
  import Slider from '../Slider/Slider.svelte'

  export let volume = 1
  export let muted = false
  $: volumePct = volume * 100
</script>

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
    icon={muted ? 'i-mdi-volume-off' : 'i-mdi-volume'}
    noBorder
    data-testid="mute-button"
  />
</div>

<style>
  div {
    --at-apply: flex flex-row items-center justify-end mr-0 flex-grow;
  }

  span {
    /* prettier-ignore */
    --at-apply: pr-2 inline-block flex-grow md:max-w-100px;
  }
</style>
