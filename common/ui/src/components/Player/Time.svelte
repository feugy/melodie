<script>
  import Slider from '../Slider/Slider.svelte'
  import { formatTime } from '../../utils'

  export let player
  export let currentTime
  export let duration

  let nextSeek = null

  function handleSeek({ detail }) {
    if (player) {
      clearTimeout(nextSeek)
      nextSeek = setTimeout(function () {
        player.currentTime = detail
      }, 100)
    }
  }
</script>

<style type="postcss">
  div {
    @apply flex items-center justify-center gap-2;
  }

  span {
    @apply text-sm;
  }
</style>

<div>
  <span>{formatTime(currentTime)}</span>
  <Slider
    class="w-full"
    current={currentTime}
    max={duration}
    on:input={handleSeek}
  />
  <span>{formatTime(duration)}</span>
</div>
