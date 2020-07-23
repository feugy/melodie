<script>
  import Image from './Image.svelte'
</script>

<div class="w-64 inline-block">
  <Image on:click {...$$props} />
</div>
