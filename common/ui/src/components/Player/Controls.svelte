<script>
  import Button from '../Button/Button.svelte'
  import { playNext, playPrevious } from '../../stores/track-queue'

  export let player
  export let isPlaying

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

<Button on:click={handlePrevious} icon="skip_previous" noBorder />
<Button on:click={handlePlay} icon={isPlaying ? 'pause' : 'play_arrow'} large />
<Button on:click={handleNext} icon="skip_next" noBorder />
