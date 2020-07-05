<script>
  import { _ } from 'svelte-intl'
  export let src
  export let hideArtist = false
</script>

<p class="flex flex-col m-2 items-start text-left" on:click>
  <span class="px-2 text-lg">{src.title}</span>
  {#if !hideArtist}
    <span class="px-2 text-sm">{src.artist}</span>
  {/if}
</p>
