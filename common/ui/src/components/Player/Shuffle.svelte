<script>
  import { isShuffling, shuffle, unshuffle } from '../../stores/track-queue'
  import Button from '../Button/Button.svelte'

  function handleShuffle() {
    if ($isShuffling) {
      unshuffle()
    } else {
      shuffle()
    }
  }
</script>

<span class:isActive={$isShuffling}>
  <Button
    on:click={handleShuffle}
    icon="i-mdi-shuffle"
    noBorder
    data-testid="shuffle-button"
  />
</span>

<style>
  .isActive {
    color: var(--hover-color);
  }
</style>
