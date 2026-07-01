<script module lang="ts">
  import type { Agent, Track as TrackModel } from '@melodie/common/models'

  export interface PlayerProps {
    agentById: Map<number, Agent>
    track?: TrackModel
    isLast: boolean
    isShuffled: boolean
    onnext: (autoplay?: boolean) => unknown
    onprevious: () => unknown
    onshuffle: () => unknown
  }
</script>

<script lang="ts">
  import PauseIcon from 'lucide-svelte/icons/pause'
  import PlayIcon from 'lucide-svelte/icons/play'
  import PreviousIcon from 'lucide-svelte/icons/skip-back'
  import NextIcon from 'lucide-svelte/icons/skip-forward'
  import ShuffleIcon from 'lucide-svelte/icons/shuffle'
  import MuteIcon from 'lucide-svelte/icons/volume-off'
  import UnmuteIcon from 'lucide-svelte/icons/volume-2'
  import { onMount } from 'svelte'
  import { MD, screen, trackCache } from '$lib/client'
  import { Button, Slider, Track } from '$lib/components'
  import { wrapWithLinks } from '$lib/utils'

  let {
    agentById,
    track,
    isLast,
    isShuffled,
    onnext,
    onprevious,
    onshuffle,
  }: PlayerProps = $props()

  let player: HTMLAudioElement | undefined
  let gainNode: GainNode | undefined
  let wakeLock: WakeLockSentinel | undefined
  let src = $state<string | null | undefined>()
  let retry: ReturnType<typeof setTimeout>
  let time = $state(0)
  let duration = $state(0)
  let loading = $state(false)
  let paused = $state(true)
  let progress = $derived(time / duration)
  let volume = $state(1)
  let muted = $state(false)
  let srcRequestId = 0

  $effect(() => {
    clearTimeout(retry)
    const requestId = ++srcRequestId

    if (!track) {
      src = undefined
      loading = false
      return
    }

    src = undefined
    loading = true
    // 1) Try cached data first.
    // 2) If missing or failing, fall back to remote URL and warm cache in background.
    // 3) Ignore stale async resolutions using requestId.
    trackCache
      .readCachedTrack(track)
      .catch(() => undefined)
      .then((data) => {
        if (requestId !== srcRequestId) {
          return
        }
        if (data) {
          src = data
          return
        }
        src = trackCache.getTrackURLAndCache(track)
        loading = false
      })
  })

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

    return () => {
      wakeLock?.release().catch(() => void 0)
    }
  })

  function format(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
  }

  function togglePlay() {
    if (src) {
      paused = !paused
    }
  }

  function handlePlay() {
    if (gainNode && track) {
      const {
        replaygain_track_gain: trackGain,
        replaygain_album_gain: albumGain,
      } = track.tags
      gainNode.gain.value = (trackGain || albumGain || { ratio: 1 }).ratio
    }

    if (!screen.supportHover) {
      navigator.wakeLock
        ?.request()
        .then((lock) => {
          wakeLock = lock
        })
        .catch(() => void 0)
    }
  }

  function handleEnded() {
    time = 0
    if (isLast) {
      wakeLock?.release().catch(() => void 0)
    } else {
      onnext?.(true)
    }
  }

  async function handleLoaded() {
    loading = false
  }

  function handleLoading() {
    loading = true
  }

  function handleError() {
    retry = setTimeout(() => {
      player?.load()
      player?.play()
    }, 1000)
  }
</script>

<div
  class="text-primary-500 grid grid-cols-[fit-content(25%)_1fr_fit-content(25%)] items-center"
  class:paused
>
  <audio
    {src}
    bind:this={player}
    bind:currentTime={time}
    bind:duration
    bind:paused
    bind:volume
    bind:muted
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
    &nbsp;
  {/if}

  <div class="flex flex-1 flex-col items-center gap-2 px-4">
    {#if screen.size < MD && track}
      <div class="flex flex-col items-center gap-2">
        <span>{track.tags.title}</span>
        <span class="text-xs"
          >{@html wrapWithLinks('artists', track.artistRefs).join(', ')}</span
        >
      </div>
    {/if}
    <div class="flex items-center gap-2">
      <Button
        color={isShuffled ? 'primary' : 'secondary'}
        onclick={() => onshuffle()}
        Icon={ShuffleIcon}
      />
      <Button
        color="secondary"
        onclick={() => onprevious()}
        Icon={PreviousIcon}
      />
      <Button
        {loading}
        onclick={togglePlay}
        size="lg"
        Icon={paused ? PlayIcon : PauseIcon}
      />
      <Button color="secondary" onclick={() => onnext()} Icon={NextIcon} />
      {#if screen.size < MD}
        {@render muteButton()}
      {/if}
    </div>
    <div class="flex w-full items-center gap-2">
      <span class="text-sm">{format(time)}</span>
      <Slider
        bind:value={() => progress, (value) => (time = value * duration)}
      />
      <span class="text-sm">{duration ? format(duration) : '--:--'}</span>
    </div>
  </div>

  {#if screen.size >= MD}
    <div class="flex w-40 items-center gap-2">
      <Slider bind:value={volume} />
      {@render muteButton()}
    </div>
  {:else}
    &nbsp;
  {/if}
</div>

{#snippet muteButton()}
  <Button
    color="secondary"
    onclick={() => (muted = !muted)}
    Icon={muted ? MuteIcon : UnmuteIcon}
  />
{/snippet}
