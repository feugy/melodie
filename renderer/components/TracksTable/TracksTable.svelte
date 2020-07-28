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

  export let tracks

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
    background-color: var(--primary-color);
  }

  .play {
    @apply hidden absolute;
    top: 0.6rem;
    left: 0.6rem;
  }

  tbody tr:hover .play {
    @apply inline-block;
  }

  tbody tr:hover .rank {
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
        <th>{$_('album')}</th>
      </tr>
    </thead>
    <tbody>
      {#each tracks as track, i (track.id)}
        <tr on:click={() => handleClick(track)}>
          <td>
            <span class="rank">{i + 1}</span>
            <span class="play">
              <Button
                on:click={evt => {
                  dispatch('play', track)
                  evt.stopImmediatePropagation()
                }}
                icon="play_arrow" />
            </span>
          </td>
          <td>{track.tags.title}</td>
          <td>{track.tags.artists[0]}</td>
          <td>{track.tags.album}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
