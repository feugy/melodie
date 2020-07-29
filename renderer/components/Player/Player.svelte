<script>
  import { _ } from 'svelte-intl'
  import { createEventDispatcher } from 'svelte'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'
  import Slider from '../Slider/Slider.svelte'
  import { toDOMSrc } from '../../utils'

  export let trackList
  const dispatch = createEventDispatcher()
  let isPlaying
  let player
  let duration = 0
  let current = 0
  let nextSeek = null

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  function handleSeek({ detail }) {
    if (player) {
      current = detail
      clearTimeout(nextSeek)
      nextSeek = setTimeout(function () {
        player.currentTime = detail
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
    trackList.next()
  }

  function handlePrevious() {
    player.pause()
    trackList.previous()
  }

  function handleTogglePlaylist() {
    dispatch('togglePlaylist')
  }
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

  .playlist {
    @apply w-1/4 text-right;
  }
</style>

<audio
  bind:this={player}
  autoplay
  src={$trackList.current && toDOMSrc($trackList.current.path)}
  on:ended={handleNext}
  bind:currentTime={current}
  bind:duration
  on:play={() => {
    isPlaying = true
  }}
  on:pause={() => {
    isPlaying = false
  }} />

<div class="flex items-center">
  <span class="current">
    {#if $trackList.current}
      <Track src={$trackList.current.tags} media={$trackList.current.media} />
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
      <span>{formatTime(current)}</span>
      <Slider class="w-full" {current} max={duration} on:input={handleSeek} />
      <span>{formatTime(duration)}</span>
    </span>
  </div>
  <span class="playlist">
    <Button
      class="mx-1"
      on:click={handleTogglePlaylist}
      icon={'queue_music'}
      large />
  </span>
</div>
