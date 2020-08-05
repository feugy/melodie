<script>
  import Album from './Album.svelte'
</script>

<a href="#/album/whateverId">
  <Album {...$$props} on:play on:enqueue />
</a>
