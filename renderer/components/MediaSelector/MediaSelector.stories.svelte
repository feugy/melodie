<script>
  import MediaSelector from './MediaSelector.svelte'
  import Button from '../Button/Button.svelte'

  export let open = false
</script>

<MediaSelector bind:open on:close on:open {...$$props} />

<Button on:click={() => (open = true)} text={'Open'} />
