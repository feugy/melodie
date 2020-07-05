<script>
  import { _ } from 'svelte-intl'
  export let src
</script>

<p on:click>
  <span>{$_('artist: _', { value: src.artist })}</span>

  <span>{$_('title: _', { value: src.title })}</span>
</p>
