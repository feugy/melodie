<script>
  import Button from '../Button/Button.svelte'

  export let repeatOne
  export let repeatAll

  function handleRepeat() {
    if (repeatAll) {
      repeatAll = false
      repeatOne = true
    } else if (repeatOne) {
      repeatAll = false
      repeatOne = false
    } else {
      repeatAll = true
    }
  }
</script>

<span class:isActive={repeatOne || repeatAll}>
  <Button
    on:click={handleRepeat}
    icon={repeatOne ? 'i-mdi-repeat-once' : 'i-mdi-repeat'}
    noBorder
    data-testid="repeat-button"
  />
</span>

<style>
  .isActive {
    color: var(--hover-color);
  }
</style>
