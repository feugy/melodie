<script>
  import { playNext, playPrevious } from '../../stores/track-queue'
  import Button from '../Button/Button.svelte'

  export let player
  export let isPlaying
  export let disabled

  function handlePlay() {
    if (player.src) {
      if (isPlaying) {
        player.pause()
      } else {
        player.play()
      }
    }
  }

  function handleNext() {
    player.pause()
    playNext()
  }

  function handlePrevious() {
    player.pause()
    playPrevious()
  }
</script>

<Button
  on:click={handlePrevious}
  icon="i-mdi-skip-previous"
  noBorder
  data-testid="previous-button"
  {disabled}
/>
<Button
  on:click={handlePlay}
  icon={isPlaying ? 'i-mdi-pause' : 'i-mdi-play'}
  large
  data-testid="play-button"
  {disabled}
/>
<Button
  on:click={handleNext}
  icon="i-mdi-skip-next"
  noBorder
  {disabled}
  data-testid="next-button"
/>
