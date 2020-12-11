<script>
  import { createEventDispatcher, onMount } from 'svelte'
  import Snackbar from './Snackbar.svelte'
  import Button from '../Button/Button.svelte'
  import { showSnack } from '../../stores/snackbars'

  let message = 'Enqueued into playlist!'
  let duration = 5
  let hasButton = false

  const dispatch = createEventDispatcher()

  onMount(handleClick)

  function handleClick() {
    showSnack(
      {
        message,
        button: hasButton ? 'Action' : null,
        action: () => dispatch('action')
      },
      duration * 1000
    )
  }
</script>

<style type="postcss">
  div {
    @apply m-4;
  }

  label {
    @apply text-right mr-4;
  }

  input {
    @apply p-2;
    color: black;

    &[type='number'] {
      width: 4rem;
    }
  }
</style>

<Snackbar />

<div>
  <label for="message">Message: </label><input
    type="text"
    bind:value={message} />
</div>
<div>
  <label for="duration">Duration: </label><input
    type="number"
    bind:value={duration} />
</div>
<div>
  <label for="hasButton">With action: </label><input
    type="checkbox"
    bind:checked={hasButton} />
</div>
<Button on:click={handleClick} text={'Show snack'} />
