<script>
  import { recordEvent, Tool } from '@atelier-wb/svelte'

  import { showSnack } from '../../stores/snackbars'
  import Button from '../Button/Button.svelte'
  import Snackbar from './Snackbar.svelte'

  let message = 'Enqueued into playlist!'
  let duration = 5
  let hasButton = false

  function handleClick() {
    showSnack(
      {
        message,
        button: hasButton ? 'Action' : null,
        action: () => recordEvent('action')
      },
      duration * 1000
    )
  }
</script>

<Tool name="Components/Snackbar">
  <Snackbar />

  <div>
    <label for="message">Message: </label><input
      type="text"
      bind:value={message}
    />
  </div>
  <div>
    <label for="duration">Duration: </label><input
      type="number"
      bind:value={duration}
    />
  </div>
  <div>
    <label for="hasButton">With action: </label><input
      type="checkbox"
      bind:checked={hasButton}
    />
  </div>
  <div>
    <Button on:click={handleClick} text={'Show snack'} />
  </div>
</Tool>

<style lang="postcss">
  div {
    --at-apply: m-4;
  }

  label {
    --at-apply: text-right mr-4;
  }

  input {
    --at-apply: p-2;
    color: black;

    &[type='number'] {
      width: 4rem;
    }
  }
</style>
