<script>
  import ConfirmationDialogue from './ConfirmationDialogue.svelte'
  import Button from '../Button/Button.svelte'
</script>

<ConfirmationDialogue {...$$props} on:close on:open>
  Are you really sure?
</ConfirmationDialogue>

<Button on:click={() => ($$props.open = true)} text={'Re-open'} />
