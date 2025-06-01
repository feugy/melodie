<script module lang="ts">
  export interface PlayerProps {
    agentById: Map<number, Agent>
    track?: TrackModel
    isLast: boolean
    onnext: (autoplay?: boolean) => unknown
    onprevious: () => unknown
  }
</script>

<script lang="ts">
  import Pause from 'lucide-svelte/icons/pause'
  import Play from 'lucide-svelte/icons/play'
  import Previous from 'lucide-svelte/icons/skip-back'
  import Next from 'lucide-svelte/icons/skip-forward'
  import { onMount } from 'svelte'
  import { getData, MD, screen } from '$lib/client'
  import { Button, Track } from '$lib/components'
  import type { Track as TrackModel, Agent } from '@melodie/common/models'
  import { wrapWithLinks } from '$lib/utils'

  let { agentById, track, isLast, onnext, onprevious }: PlayerProps = $props()

  let player: HTMLAudioElement | undefined
  let gainNode: GainNode | undefined
  let time = $state(0)
  let duration = $state(0)
  let loading = $state(false)
  let paused = $state(true)
  let progress: HTMLDivElement | null

  const src = $derived(getData(track, agentById))

  let wakeLock: WakeLockSentinel | undefined

  $effect(() => {
    // reset player when src is unset
    if (!src) {
      paused = true
      duration = 0
    } else {
      player?.play()
      paused = false
    }
  })

  onMount(() => {
    // There's an unsolvable issue with Chrome Android:
    // when bluetooth is active prior to loading the app,
    // built AudioContext starts suspended, but can never be resumed
    if (player && 'AudioContext' in window && !('chrome' in window)) {
      const context = new AudioContext()
      const sourceNode = context.createMediaElementSource(player)
      gainNode = context.createGain()
      sourceNode.connect(gainNode)
      gainNode.connect(context.destination)
    }
    return () => wakeLock?.release().catch(() => void 0)
  })

  function format(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
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

  function handlePlay() {
    if (gainNode && track) {
      const {
        replaygain_track_gain: trackGain,
        replaygain_album_gain: albumGain,
      } = track.tags
      gainNode.gain.value = (trackGain || albumGain || { ratio: 1 }).ratio
    }
    navigator.wakeLock
      ?.request()
      .then((lock) => {
        wakeLock = lock
      })
      .catch(() => void 0)
  }

  function handleEnded() {
    time = 0
    if (!isLast) {
      onnext?.(true)
    }
  }

  async function handleLoaded() {
    loading = false
  }

  function handleLoading() {
    loading = true
  }

  function handleError(err: unknown) {
    const save = track
    track = undefined
    setTimeout(() => (track = save), 1000)
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
      { once: true }
    )
  }
</script>

<div
  class="grid grid-cols-[fit-content(25%)_1fr_fit-content(25%)] items-center"
  class:paused
>
  <audio
    {src}
    bind:this={player}
    bind:currentTime={time}
    bind:duration
    bind:paused
    crossorigin="anonymous"
    data-testid="audio-player"
    onplay={handlePlay}
    onended={handleEnded}
    onloadstart={handleLoading}
    onloadeddata={handleLoaded}
    onerror={handleError}
  ></audio>

  {#if screen.size >= MD}
    <Track {agentById} src={track} />
  {:else}
    <span></span>
  {/if}

  <div class="flex flex-1 flex-col items-center gap-2 p-2">
    {#if screen.size < MD && track}
      <span class="text-center"
        >{@html wrapWithLinks('artists', track.artistRefs, 'text-sm').join(
          ', '
        )} - {track.tags.title}</span
      >
    {/if}
    <div class="flex items-center gap-2">
      <Button color="secondary" onclick={() => onprevious()} Icon={Previous} />
      <Button
        {loading}
        onclick={togglePlay}
        size="lg"
        Icon={paused ? Play : Pause}
      />
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
          class="bg-primary-500 h-full w-[calc(100*var(--progress))] rounded-lg"
          style="--progress: {time / duration}%"
        ></div>
      </div>
      <span class="text-sm">{duration ? format(duration) : '--:--'}</span>
    </div>
  </div>

  <span></span>
</div>
