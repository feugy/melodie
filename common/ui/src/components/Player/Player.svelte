<script>
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'
  import Progress from '../Progress/Progress.svelte'
  import Time from './Time.svelte'
  import AddToPlaylist from './AddToPlaylist.svelte'
  import Controls from './Controls.svelte'
  import Volume from './Volume.svelte'
  import Shuffle from './Shuffle.svelte'
  import Repeat from './Repeat.svelte'
  import { current, next, tracks } from '../../stores/track-queue'
  import { playNext } from '../../stores/track-queue'
  import { screenSize, MD } from '../../stores/window'

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
    if ('AudioContext' in window) {
      const context = new AudioContext()
      const sourceNode = context.createMediaElementSource(player)
      gainNode = context.createGain()
      sourceNode.connect(gainNode)
      gainNode.connect(context.destination)
    }

    const currentSub = current.subscribe(current => {
      if (!current) {
        src = null
        if (player) {
          isPlaying = false
          player.load()
        }
      } else {
        src = window.dlUrl + current.data
        isLoading = true
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

    const nextSub = next.subscribe(async next => {
      if (next) {
        // pre-fetch
        const nextUrl = window.dlUrl + next.data
        try {
          await fetch(nextUrl)
        } catch (err) {
          console.warn(`failed to pre-fetch file ${nextUrl}: ${err.message}`)
        }
      }
    })
    return () => {
      currentSub.unsubscribe()
      nextSub.unsubscribe()
    }
  })

  function handleLoaded() {
    // Chrome will block playing songs until user interact with the page, and will
    // issue an error on console
    isLoading = false
    player.play()
  }

  function handleLoading() {
    isPlaying = false
    isLoading = true
  }

  function handlePause() {
    isPlaying = false
    window.cancelAnimationFrame(timeUpdateTimer)
  }

  function handleEnded() {
    isPlaying = false
    if (repeatOne) {
      player.play()
    } else if (repeatAll || $tracks[$tracks.length - 1] !== $current) {
      player.pause()
      playNext()
    }
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
</script>

<style type="postcss">
  .root {
    /* get rid of whitespaces introduced by conditionals */
    font-size: 0px;

    & > audio {
      height: 0;
    }
  }

  .content {
    @apply flex items-center justify-center;
  }

  .player {
    @apply flex-col;
  }

  .controls {
    @apply flex items-center justify-center gap-2 px-1;
  }

  .current {
    @apply flex-grow;
  }

  .expansion {
    @apply p-2;
  }

  .handle {
    @apply inline-block w-full cursor-pointer text-center;
    background: var(--outline-color);
  }

  @screen md {
    .content {
      @apply p-2;
    }

    .player {
      @apply flex-grow;
    }

    .current {
      @apply w-1/4 flex-grow-0;
    }

    .volume {
      @apply w-1/4;
    }
  }
</style>

<div class="root">
  <!-- svelte-ignore a11y-media-has-caption -->
  <audio
    data-testid="audio"
    autoplay
    bind:this={player}
    {src}
    bind:duration
    bind:volume
    bind:muted
    on:loadstart={handleLoading}
    on:loadeddata={handleLoaded}
    on:ended={handleEnded}
    on:play={() => {
      if (gainNode) {
        // required on Chrome
        gainNode.context.resume()
      }
      isPlaying = true
      timeUpdateTimer = window.requestAnimationFrame(updateTime)
    }}
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
          <Controls {player} {isPlaying} />
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
          {#if isLoading}<Progress />{:else}<Controls
              {player}
              {isPlaying}
            />{/if}
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
