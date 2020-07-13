<script>
  import { _ } from 'svelte-intl'
  import { Image } from 'smelte'
  import { toDOMSrc } from '../utils'

  export let src
  export let hideArtist = false
  export let media = null
</script>

<div class="flex m-2 items-start text-left" on:click>
  {#if media}
    <Image class="h-16 w-16 flex-none" src={toDOMSrc(media)} />
  {/if}
  <div class="flex flex-col">
    <span class="px-2 text-lg">{src.title}</span>
    {#if !hideArtist}
      <span class="px-2 text-sm">{src.artist}</span>
    {/if}
  </div>
</div>
