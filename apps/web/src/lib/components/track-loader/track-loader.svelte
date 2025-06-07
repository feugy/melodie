<script lang="ts">
  import { getData } from '$lib/client'
  import type { Agent, Track } from '@melodie/common/models'

  interface TrackLoaderProps {
    agentById: Map<number, Agent>
    tracks?: Track[]
    currentIdx: number | null
  }

  let { agentById, tracks, currentIdx }: TrackLoaderProps = $props()

  let retry: ReturnType<typeof setTimeout>

  $effect(() => {
    clearTimeout(retry)
    const next = getData(tracks?.[(currentIdx ?? 0) + 1], agentById)
    if (next) {
      const loader = new Audio(next)
      loader.addEventListener('error', () => {
        retry = setTimeout(() => loader.load(), 1000)
      })
      loader.muted = true
      loader.load()
    }
  })
</script>
