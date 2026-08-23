<script lang="ts">
  import { localLibrary } from '$lib/client'
  import type { Track } from '@melodie/common/models'
  import DatabaseIcon from '@lucide/svelte/icons/database'

  interface LocalPinProps {
    track?: Track
  }

  let { track }: LocalPinProps = $props()

  $effect(() => {
    // Re-runs whenever track or localLibrary.state changes (Svelte 5 tracks both reads).
    // check() awaits initPromise internally, so it's safe to call before init completes.
    if (track && localLibrary.state !== 'disconnected') {
      void localLibrary.check(track)
    }
  })
</script>

{#if localLibrary.isLocal(track)}
  <DatabaseIcon class="opacity-40" size={14} />
{/if}
