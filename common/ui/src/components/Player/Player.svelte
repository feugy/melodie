<script>
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'
  import Time from './Time.svelte'
  import AddToPlaylist from './AddToPlaylist.svelte'
  import Controls from './Controls.svelte'
  import Volume from './Volume.svelte'
  import Shuffle from './Shuffle.svelte'
  import Repeat from './Repeat.svelte'
  import { isDesktop } from '../../stores/settings'
  import { current, tracks } from '../../stores/track-queue'
  import { playNext } from '../../stores/track-queue'
  import { screenSize, MD } from '../../stores/window'
  import { enhanceUrl } from '../../utils'

  let isPlaying
  let isLoading
  let player
  let timeUpdateTimer
  let duration = 0
  let currentTime = 0
  let src = null
  let muted = false
  let repeatOne = false
  let repeatAll = false
  let volume = 1
  let expanded = false
  let gainNode

  onMount(() => {
    buildAudioContext()

    navigator.bluetooth
      ?.requestDevice()
      .then(device => console.log(device))
      .catch(error => console.error(error))

    const currentSubscription = current.subscribe(current => {
      if (!current) {
        src = null
      } else {
        src = enhanceUrl(current.data)
      }
      if (player && src !== player.currentSrc) {
        isPlaying = false
        player.load()
      }
    })
    return () => {
      currentSubscription.unsubscribe()
    }
  })

  async function handleLoaded() {
    isLoading = false
  }

  function handleLoading() {
    isPlaying = false
    isLoading = true
  }

  function handlePlay() {
    configureGain()
    isPlaying = true
    timeUpdateTimer = window.requestAnimationFrame(updateTime)
  }

  function handlePause() {
    isPlaying = false
    window.cancelAnimationFrame(timeUpdateTimer)
  }

  function handleEnded() {
    isPlaying = false
    if (repeatOne) {
      player.play()
    } else {
      player.pause()
      player.currentTime = 0
      if (repeatAll || $tracks[$tracks.length - 1] !== $current) {
        playNext()
      }
    }
  }

  function handleError() {
    isPlaying = false
    const save = src
    src = null
    setTimeout(() => (src = save), 100)
  }

  // Do not use svelte's `bind:currentTime` who eats too much CPU
  // instead, poll the current time ourselves, up to 10 times per second
  function updateTime() {
    if (player) {
      currentTime = player.currentTime
      setTimeout(() => {
        timeUpdateTimer = window.requestAnimationFrame(updateTime)
      }, 100)
    }
  }

  async function buildAudioContext() {
    // There's an unsolvable issue with Chrome Android:
    // when bluetooth is active prior to loading the app,
    // built AudioContext starts suspended, but can never be resumed
    if ('AudioContext' in window && (!window.chrome || $isDesktop === true)) {
      const context = new AudioContext()
      const sourceNode = context.createMediaElementSource(player)
      gainNode = context.createGain()
      sourceNode.connect(gainNode)
      gainNode.connect(context.destination)
    }
  }

  function configureGain() {
    if (gainNode) {
      const {
        replaygain_track_gain: trackGain,
        replaygain_album_gain: albumGain
      } = $current.tags
      gainNode.gain.value = (trackGain || albumGain || { ratio: 1 }).ratio
    }
  }
</script>

<style lang="postcss">
  .root {
    & > audio {
      height: 0;
    }
  }

  .content {
    @apply flex items-center justify-center md:p-2;
  }

  .player {
    @apply flex-col md:flex-grow;
  }

  .controls {
    @apply flex items-center justify-center gap-2 px-1;
  }

  .current {
    @apply flex-grow md:w-1/4 md:flex-grow-0;
  }

  .expansion {
    @apply p-2;
  }

  .handle {
    @apply inline-block w-full cursor-pointer text-center;
    background: var(--outline-color);
  }

  .volume {
    @apply md:w-1/4;
  }
</style>

<div class="root">
  <!-- svelte-ignore a11y-media-has-caption -->
  <audio
    data-testid="audio"
    autoplay
    crossOrigin="anonymous"
    bind:this={player}
    {src}
    bind:duration
    bind:volume
    bind:muted
    on:loadstart={handleLoading}
    on:loadeddata={handleLoaded}
    on:error={handleError}
    on:ended={handleEnded}
    on:play={handlePlay}
    on:pause={handlePause}
  />{#if $screenSize >= MD}
    <div class="content">
      <span class="current">
        {#if $current}
          <Track src={$current} />
        {/if}
      </span>
      <div class="player">
        <span class="controls">
          <AddToPlaylist />
          <Shuffle />
          <Controls {player} {isPlaying} disabled={isLoading} />
          <Repeat bind:repeatAll bind:repeatOne />
          {#if $current}
            <Button icon="favorite_border" noBorder class="invisible" />
          {/if}
        </span>
        <Time {player} {currentTime} {duration} />
      </div>
      <span class="volume">
        <Volume bind:volume bind:muted />
      </span>
    </div>
  {:else}
    <div class="content">
      {#if $current}
        <div class="current">
          <Track src={$current} />
        </div>
      {/if}
      <div class="player">
        <span class="controls">
          <Controls {player} {isPlaying} disabled={isLoading} />
        </span>
      </div>
    </div>
    <i class="material-icons handle" on:click={() => (expanded = !expanded)}
      >{expanded ? 'expand_more' : 'expand_less'}</i
    >{#if expanded}
      <ul class="expansion" transition:slide>
        <li>
          <Time {player} {currentTime} {duration} />
        </li>
        <li>
          <div class="controls">
            <AddToPlaylist />
            <Shuffle />
            <Repeat bind:repeatAll bind:repeatOne />
            <Volume bind:volume bind:muted />
          </div>
        </li>
      </ul>
    {/if}
  {/if}
</div>
