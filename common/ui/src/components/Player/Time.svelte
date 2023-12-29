<script>
  import { formatTime } from '../../utils'
  import Slider from '../Slider/Slider.svelte'

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

<style>
  div {
    --at-apply: flex items-center justify-center gap-2;
  }

  span {
    --at-apply: text-sm;
  }
</style>
