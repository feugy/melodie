<script>
  import Button from '../Button/Button.svelte'
  import { isShuffling, unshuffle, shuffle } from '../../stores/track-queue'

  function handleShuffle() {
    if ($isShuffling) {
      unshuffle()
    } else {
      shuffle()
    }
  }
</script>

<style type="postcss">
  .isActive {
    color: var(--hover-color);
  }
</style>

<span class:isActive={$isShuffling}>
  <Button on:click={handleShuffle} icon="shuffle" noBorder />
</span>
