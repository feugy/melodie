<script>
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Observable, race } from 'rxjs'
  import {
    bufferCount,
    buffer,
    debounceTime,
    tap,
    share,
    first,
    repeat
  } from 'rxjs/operators'
  import Button from '../Button/Button.svelte'
  import { formatTime } from '../../utils'

  export let tracks = undefined
  export let current = undefined
  export let withAlbum = true
  $: sortedTracks =
    tracks &&
    tracks
      .concat()
      .sort(
        (a, b) =>
          ((a.tags.track && a.tags.track.no) || Infinity) -
          ((b.tags.track && b.tags.track.no) || Infinity)
      )

  const dblClickDuration = 250
  const dispatch = createEventDispatcher()

  let clickObserver
  const clicks$ = Observable.create(obs => (clickObserver = obs)).pipe(share())
  const debounce$ = clicks$.pipe(debounceTime(dblClickDuration))
  const clickLimit$ = clicks$.pipe(bufferCount(2))
  const bufferGate$ = race(debounce$, clickLimit$).pipe(first(), repeat())

  const subscription = clicks$.pipe(buffer(bufferGate$)).subscribe(tracks => {
    // play on double click, enqueue on simple
    dispatch(tracks.length === 2 ? 'play' : 'enqueue', tracks[0])
  })

  function handleClick(track) {
    clickObserver.next(track)
  }

  onDestroy(() => subscription.unsubscribe())
</script>

<style type="postcss">
  table {
    @apply w-full border-collapse mt-4;
  }

  thead {
    border-bottom: solid 2px var(--outline-color);
  }

  th,
  td {
    @apply p-3 text-left relative;
  }

  th {
    @apply font-semibold pt-0 pr-0 text-sm;
  }

  tbody tr:nth-child(2n + 1) {
    background-color: var(--hover-color);
  }

  tbody tr:hover {
    @apply cursor-pointer;
    background-color: var(--hover-primary-color);
  }

  tbody tr.current {
    background-color: var(--outline-color);
  }

  .play {
    @apply hidden absolute;
    top: 0.6rem;
    left: 0.6rem;
  }

  tbody tr:hover:not(.current) .play {
    @apply inline-block;
  }

  tbody tr:hover:not(.current) .rank {
    @apply hidden;
  }
</style>

{#if tracks}
  <table>
    <thead>
      <tr>
        <th>{$_('#')}</th>
        <th>{$_('track')}</th>
        <th>{$_('artist')}</th>
        {#if withAlbum}
          <th>{$_('album')}</th>
        {/if}
        <th>{$_('duration')}</th>
      </tr>
    </thead>
    <tbody>
      {#each sortedTracks as track, i (track.id)}
        <tr
          on:click={() => handleClick(track)}
          class:current={$current === track}>
          <td>
            <span class="rank">
              {(track.tags.track && track.tags.track.no) || '--'}
            </span>
            <span class="play">
              <Button
                on:click={evt => {
                  dispatch('play', track)
                  evt.stopImmediatePropagation()
                }}
                icon={'play_arrow'} />
            </span>
          </td>
          <td>{track.tags.title}</td>
          <td>{track.tags.artists[0]}</td>
          {#if withAlbum}
            <td>{track.tags.album}</td>
          {/if}
          <td>{formatTime(track.tags.duration)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
