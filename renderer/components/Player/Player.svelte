<script>
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'
  import Slider from '../Slider/Slider.svelte'
  import { toDOMSrc, formatTime } from '../../utils'
  import { next, previous, current } from '../../stores/track-queue'

  const dispatch = createEventDispatcher()
  let isPlaying
  let player
  let duration = 0
  let currentTime = 0
  let nextSeek = null
  let src = null
  let muted = false
  let volume = 1
  $: volumePct = volume * 100

  const currentSub = current.subscribe(current => {
    if (!current) {
      src = null
      if (player) {
        isPlaying = false
        player.load()
      }
    } else {
      src = toDOMSrc(current.path)
    }
  })

  function handleSeek({ detail }) {
    if (player) {
      clearTimeout(nextSeek)
      nextSeek = setTimeout(function () {
        currentTime = detail
      }, 100)
    }
  }

  function handlePlay() {
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
  }

  function handleNext() {
    player.pause()
    next()
  }

  function handlePrevious() {
    player.pause()
    previous()
  }

  function handleTogglePlaylist() {
    dispatch('togglePlaylist')
  }

  onDestroy(() => currentSub.unsubscribe())
</script>

<style type="postcss">
  .player {
    @apply flex-grow flex-col;
  }

  .controls {
    @apply flex items-center justify-center;
  }

  .controls > * {
    @apply mx-2;
  }

  .time > span {
    @apply text-sm;
  }

  .current {
    @apply w-1/4;
  }

  .playlist,
  .volume {
    @apply flex flex-row items-center justify-end;
  }

  .playlist {
    @apply w-1/4;
  }

  .volume {
    @apply pr-2;
  }

  .volume-slider {
    @apply opacity-0 pr-2 inline-block;
    transition: opacity ease-in-out 150ms;
    width: 100px;
  }

  .playlist:hover .volume-slider {
    @apply opacity-100;
  }
</style>

<!--  -->
<audio
  bind:this={player}
  autoplay
  {src}
  on:ended={handleNext}
  bind:currentTime
  bind:duration
  bind:volume
  bind:muted
  on:play={() => {
    isPlaying = true
  }}
  on:pause={() => {
    isPlaying = false
  }} />

<div class="flex items-center">
  <span class="current">
    {#if $current}
      <Track src={$current.tags} media={$current.media} />
    {/if}
  </span>
  <div class="player">
    <span class="controls">
      <Button
        class="mx-1"
        on:click={handlePrevious}
        icon="skip_previous"
        noBorder />
      <Button
        class="mx-1"
        on:click={handlePlay}
        icon={isPlaying ? 'pause' : 'play_arrow'}
        large />
      <Button class="mx-1" on:click={handleNext} icon="skip_next" noBorder />
    </span>
    <span class="controls time">
      <span>{formatTime(currentTime)}</span>
      <Slider
        class="w-full"
        current={currentTime}
        max={duration}
        on:input={handleSeek} />
      <span>{formatTime(duration)}</span>
    </span>
  </div>
  <span class="playlist">
    <div class="volume">
      <span class="volume-slider">
        <Slider
          current={volumePct}
          max={100}
          on:input={({ detail: v }) => {
            if (v != null) {
              volume = v / 100
            }
          }} />
      </span>
      <Button
        on:click={() => (muted = !muted)}
        icon={muted ? 'volume_off' : 'volume_up'}
        noBorder />
    </div>
    <Button on:click={handleTogglePlaylist} icon={'queue_music'} large />
  </span>
</div>
