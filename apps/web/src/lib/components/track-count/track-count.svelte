<script lang="ts">
  import { formatTimeLong, sumDurations } from "$lib/utils"
  import type { Track } from "@melodie/common/models"
  import { t } from 'svelte-intl-precompile'

  let { tracks }: { tracks: Track[] } = $props()
</script>

<p class="text-sm opacity-80">
  {$t('_ tracks', { values: { total: tracks.length } })}
  {#if tracks.length > 0}<span aria-hidden="true">&middot;</span>{/if}
  {formatTimeLong(sumDurations(tracks))}
</p>