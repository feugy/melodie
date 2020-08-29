<script>
  import TrackDetailsDialogue from './TrackDetailsDialogue.svelte'
  import Button from '../Button/Button.svelte'

  export let open = true
</script>

<TrackDetailsDialogue bind:open on:close on:open {...$$props} />

<Button on:click={() => (open = true)} text={'Open'} />
