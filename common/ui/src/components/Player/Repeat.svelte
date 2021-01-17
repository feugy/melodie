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

<style type="postcss">
  .isActive {
    color: var(--hover-color);
  }
</style>

<span class:isActive={repeatOne || repeatAll}>
  <Button
    on:click={handleRepeat}
    icon={repeatOne ? 'repeat_one' : 'repeat'}
    noBorder
  />
</span>
