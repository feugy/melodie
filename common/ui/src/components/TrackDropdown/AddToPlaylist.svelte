<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'

  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'

  export let track
  export let open = false
  const dispatch = createEventDispatcher()
</script>

<div role="menuitem" aria-haspopup="menu" aria-expanded={open}>
  <i class="icons i-mdi-plus-box-multiple" /><span>{$_('add to playlist')}</span
  ><i class="icons i-mdi-chevron-right" />
</div>
<span class="button">
  <AddToPlaylist
    tracks={[track]}
    {open}
    on:close
    on:select={() => dispatch('close')}
  />
</span>

<style>
  div {
    --at-apply: inline-flex min-w-full text-left items-center;

    & > i {
      --at-apply: text-base;
    }

    & > span {
      --at-apply: flex-grow;
    }

    & > i:first-child {
      --at-apply: mr-2;
    }
  }

  .button {
    --at-apply: invisible h-0 -mt-16;
  }
</style>
