<script>
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'
  import { current } from '../../stores/track-queue'
</script>

{#if $current}
  <span><AddToPlaylist tracks={[$current]} noBorder /></span>
{/if}
