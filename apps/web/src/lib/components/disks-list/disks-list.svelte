<script lang="ts">
  import { TracksTable, type TracksTableProps } from '$lib/components'
  import type { Track } from '@melodie/common/models'
  import { t } from 'svelte-intl-precompile'

  let { tracks, ...rest }: TracksTableProps = $props()

  let disks = $derived(
    tracks
      ? tracks
          .reduce<{ num: number; tracks: Track[] }[]>((disks, track) => {
            const num = track.tags.disk?.no ?? Number.POSITIVE_INFINITY
            let disk = disks.find((disk) => disk.num === num)
            if (!disk) {
              disk = { num, tracks: [] }
              disks.push(disk)
            }
            disk.tracks.push(track)
            return disks
          }, [])
          .sort((a, b) => a.num - b.num)
      : []
  )
</script>

{#each disks as { num, tracks } (num)}
  {#if num !== Infinity}
    <h3>{$t('disk _', { values: { num } })}</h3>
  {/if}
  <TracksTable {tracks} {...rest} />
{/each}

<style lang="postcss">
  h3 {
    @apply mb-4 mt-8 text-left text-lg;
  }
</style>
