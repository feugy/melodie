<script lang="ts">
  import { groupByDisk } from '$lib/utils/tracks'
  import { t } from 'svelte-intl-precompile'
  import TracksTable  from '../tracks-table/tracks-table.svelte'
  import type { TracksTableProps } from '../tracks-table/tracks-table.svelte'

  let { tracks, ...rest }: TracksTableProps = $props()

  let disks = $derived(groupByDisk(tracks))
</script>

{#each disks as { num, tracks } (num)}
  {#if num > 0}
    <h3 class="mt-8 mb-4 text-left text-lg">
      {$t('disk _', { values: { num } })}
    </h3>
  {/if}
  <TracksTable {tracks} {...rest} />
{/each}
