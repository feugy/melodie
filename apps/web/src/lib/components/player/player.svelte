<script module lang="ts">
  export interface PlayerProps {
    agentById: Map<number, Agent>
    track?: TrackModel
    onnext: (autoplay?: boolean) => unknown
    onprevious: () => unknown
  }
</script>

<script lang="ts">
  import Pause from 'lucide-svelte/icons/pause'
  import Play from 'lucide-svelte/icons/play'
  import Previous from 'lucide-svelte/icons/skip-back'
  import Next from 'lucide-svelte/icons/skip-forward'
  import { getData } from '$lib/client'
  import { Button, Track } from '$lib/components'
  import type { Track as TrackModel, Agent } from '@melodie/common/models'

  let { agentById, track, onnext, onprevious }: PlayerProps = $props()

  let time = $state(0)
  let duration = $state(0)
  let paused = $state(true)
  let progress: HTMLDivElement | null

  const src = $derived(getData(track, agentById))

  $effect(() => {
    // reset player when src is unset
    if (!src) {
      paused = true
      duration = 0
    }
  })

  function format(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
  }

  function handleEnded() {
    time = 0
    onnext?.(true)
  }

  function togglePlay() {
    paused = !paused
  }

  function seek(e: PointerEvent) {
    if (!progress) return

    const { left, width } = progress.getBoundingClientRect()

    let p = (e.clientX - left) / width
    if (p < 0) p = 0
    if (p > 1) p = 1

    time = p * duration
  }

  function handleProgressClick(e: PointerEvent) {
    progress = e.currentTarget as HTMLDivElement
    seek(e)

    window.addEventListener('pointermove', seek)

    window.addEventListener(
      'pointerup',
      () => {
        window.removeEventListener('pointermove', seek)
      },
      {
        once: true,
      }
    )
  }
</script>

<div
  class="grid grid-cols-[minmax(auto,20%)_1fr] items-center gap-4"
  class:paused
>
  <audio
    {src}
    autoplay
    bind:currentTime={time}
    bind:duration
    bind:paused
    onended={handleEnded}
  ></audio>

  <Track {agentById} src={track} />

  <div class="flex flex-1 flex-col items-center gap-2">
    <div class="flex items-center gap-2">
      <Button color="secondary" onclick={() => onprevious()} Icon={Previous} />
      <Button onclick={togglePlay} size="lg" Icon={paused ? Play : Pause} />
      <Button color="secondary" onclick={() => onnext()} Icon={Next} />
    </div>
    <div class="flex w-full items-center gap-2">
      <span class="text-sm">{format(time)}</span>
      <div
        class="bg-secondary-500 h-2 flex-1 overflow-hidden rounded-lg"
        bind:this={progress}
        onpointerdown={handleProgressClick}
      >
        <div
          class="bg-primary-500 h-full w-[calc(100*var(--progress))]"
          style="--progress: {time / duration}%"
        ></div>
      </div>
      <span class="text-sm">{duration ? format(duration) : '--:--'}</span>
    </div>
  </div>
</div>
