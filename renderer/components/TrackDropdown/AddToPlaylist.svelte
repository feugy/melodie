<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'

  export let track
  let open = false
  const dispatch = createEventDispatcher()
</script>

<style type="postcss">
  div {
    @apply inline-flex min-w-full text-left items-center;

    & > i {
      @apply text-base;
    }

    & > span {
      @apply flex-grow;
    }

    & > i:first-child {
      @apply mr-2;
    }
  }

  .button {
    @apply invisible h-0 -mt-16;
  }
</style>

<div on:click={() => (open = true)}>
  <i
    class="material-icons">library_add</i><span>{$_('add to playlist')}</span><i
    class="material-icons">arrow_drop_down</i>
</div>
<span class="button">
  <AddToPlaylist
    tracks={[track]}
    {open}
    on:select={() => {
      open = false
      dispatch('close')
    }} />
</span>
