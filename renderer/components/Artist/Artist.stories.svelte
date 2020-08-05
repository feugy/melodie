<script>
  import Artist from './Artist.svelte'
</script>

<a href="#/artist/whateverId">
  <Artist {...$$props} on:play on:enqueue />
</a>
