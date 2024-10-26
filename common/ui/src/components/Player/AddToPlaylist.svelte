<script>
  import { current } from '../../stores/track-queue'
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'
</script>

{#if $current}
  <span><AddToPlaylist tracks={[$current]} noBorder /></span>
{/if}
