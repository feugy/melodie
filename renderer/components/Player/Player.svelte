<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'
  import Slider from '../Slider/Slider.svelte'
  import AddToPlaylist from '../AddToPlaylist/AddToPlaylist.svelte'
  import { toDOMSrc, formatTime } from '../../utils'
  import {
    playNext,
    playPrevious,
    current,
    tracks,
    isShuffling,
    unshuffle,
    shuffle
  } from '../../stores/track-queue'

  export let isPlaylistOpen = false
  let isPlaying
  let player
  let duration = 0
  let currentTime = 0
  let nextSeek = null
  let src = null
  let muted = false
  let repeatOne = false
  let repeatAll = false
  let volume = 1
  $: volumePct = volume * 100

  onMount(() => {
    let gainNode
    if ('AudioContext' in window) {
      const context = new AudioContext()
      const sourceNode = context.createMediaElementSource(player)
      gainNode = context.createGain()
      sourceNode.connect(gainNode)
      gainNode.connect(context.destination)
    }

    return current.subscribe(current => {
      if (!current) {
        src = null
        if (player) {
          isPlaying = false
          player.load()
        }
      } else {
        src = toDOMSrc(current.path)
        const {
          replaygain_track_gain: trackGain,
          replaygain_album_gain: albumGain
        } = current.tags
        if (gainNode) {
          // apply replay gain when set
          gainNode.gain.value = (trackGain || albumGain || { ratio: 1 }).ratio
        }
      }
    })
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
    playNext()
  }

  function handlePrevious() {
    player.pause()
    playPrevious()
  }

  function handleRepeat() {
    if (repeatAll) {
      repeatAll = false
      repeatOne = true
    } else if (repeatOne) {
      repeatAll = false
      repeatOne = false
    } else {
      repeatAll = true
    }
  }

  function handleEnded() {
    isPlaying = false
    if (repeatOne) {
      handlePlay()
    } else if (repeatAll || $tracks[$tracks.length - 1] !== $current) {
      handleNext()
    }
  }

  function handleShuffle() {
    if ($isShuffling) {
      unshuffle()
    } else {
      shuffle()
    }
  }
</script>

<style type="postcss">
  .player {
    @apply flex-grow flex-col;
  }

  .controls {
    @apply flex items-center justify-center;
    & > * {
      @apply mx-2;
    }
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

  .isActive {
    color: var(--hover-color);
  }
</style>

<!-- svelte-ignore a11y-media-has-caption -->
<audio
  data-testid="audio"
  bind:this={player}
  autoplay
  {src}
  on:ended={handleEnded}
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
      <Track src={$current} />
    {/if}
  </span>
  <div class="player">
    <span class="controls">
      {#if $current}
        <AddToPlaylist tracks={[$current]} noBorder />
      {/if}
      <span class:isActive={$isShuffling}>
        <Button on:click={handleShuffle} icon="shuffle" noBorder />
      </span>
      <Button
        class="ml-2 mr-1"
        on:click={handlePrevious}
        icon="skip_previous"
        noBorder />
      <Button
        class="mx-1"
        on:click={handlePlay}
        icon={isPlaying ? 'pause' : 'play_arrow'}
        large />
      <Button
        class="ml-1 mr-2"
        on:click={handleNext}
        icon="skip_next"
        noBorder />
      <span class:isActive={repeatOne || repeatAll}>
        <Button
          on:click={handleRepeat}
          icon={repeatOne ? 'repeat_one' : 'repeat'}
          noBorder />
      </span>
      {#if $current}
        <Button icon="favorite_border" noBorder class="invisible" />
      {/if}
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
    <Button
      on:click={() => (isPlaylistOpen = !isPlaylistOpen)}
      icon="queue_music"
      text={$_(isPlaylistOpen ? 'close queue' : 'open queue')}
      primary={!isPlaylistOpen}
      badge={$tracks.length || null} />
  </span>
</div>
