<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import { formatTime, wrapWithLink, createClickObservable } from '../../utils'
  import { add } from '../../stores/track-queue'

  export let tracks
  export let current
  export let withAlbum = true
  $: sortedTracks = tracks
    ? tracks
        .concat()
        .sort(
          (a, b) =>
            ((a.tags.track && a.tags.track.no) || Infinity) -
            ((b.tags.track && b.tags.track.no) || Infinity)
        )
    : []

  // play on double click, enqueue on simple
  const clicks$ = createClickObservable(
    track => add(track),
    track => add(track, true)
  )

  onMount(() => clicks$.subscribe())
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
    background-color: var(--hover-bg-color);
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
          on:click={() => clicks$.next(track)}
          class:current={$current && $current.id === track.id}>
          <td>
            <span class="rank">
              {(track.tags.track && track.tags.track.no) || '--'}
            </span>
            <span class="play">
              <Button on:click={() => add(track, true)} icon={'play_arrow'} />
            </span>
          </td>
          <td>{track.tags.title}</td>
          <td>
            {@html wrapWithLink('artist', track.artistRefs[0])}
          </td>
          {#if withAlbum}
            <td>
              {@html wrapWithLink('album', track.albumRef)}
            </td>
          {/if}
          <td>{formatTime(track.tags.duration)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
