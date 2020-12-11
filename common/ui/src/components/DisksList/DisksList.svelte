<script>
  import { _ } from 'svelte-intl'
  import TracksTable from '../TracksTable/TracksTable.svelte'

  export let tracks

  $: disks = tracks
    ? tracks.reduce((disks, track) => {
        const num = (track.tags.disk && track.tags.disk.no) || Infinity
        let disk = disks.find(disk => disk.num === num)
        if (!disk) {
          disk = { num, tracks: [] }
          disks.push(disk)
        }
        disk.tracks.push(track)
        return disks
      }, [])
    : []
</script>

<style type="postcss">
  h3 {
    @apply text-left text-lg mt-8 mb-4;
  }
</style>

{#each disks as { num, tracks } (num)}
  {#if num !== Infinity}
    <h3>{$_('disk _', { num })}</h3>
  {/if}
  <TracksTable {...{ ...$$restProps, tracks }} />
{/each}
