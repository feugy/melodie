<script>
  import Tags from './Tags.svelte'

  export let src
  let open = false
</script>

<article
  class="rounded overflow-hidden shadow-md w-full h-full cursor-pointer"
  on:click>
  <header class="px-6 py-4">
    <span class="text-xl mb-2">{src.title}</span>
  </header>
</article>
