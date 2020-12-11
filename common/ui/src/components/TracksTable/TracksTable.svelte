<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import TrackDropdown from '../TrackDropdown/TrackDropdown.svelte'
  import TrackDetailsDialogue from '../TrackDetailsDialogue/TrackDetailsDialogue.svelte'
  import { formatTime, wrapWithLink } from '../../utils'
  import { createClickToAddObservable } from '../../stores/track-queue'

  export let tracks
  export let current
  export let withAlbum = true
  let openedTrack = null

  $: sortedTracks = tracks
    ? tracks
        .concat()
        .sort(
          (a, b) =>
            ((a.tags.track && a.tags.track.no) || Infinity) -
            ((b.tags.track && b.tags.track.no) || Infinity)
        )
    : []

  const clicks$ = createClickToAddObservable()

  onMount(() => clicks$.subscribe())
</script>

<style type="postcss">
  table,
  tbody,
  thead,
  tr,
  td,
  th {
    @apply block;
  }

  table {
    @apply w-full mt-4;
  }

  tr {
    @apply grid gap-0;
    grid-template-columns: 60px repeat(10, 1fr) 60px;
  }

  thead {
    border-bottom: solid 2px var(--outline-color);
  }

  th,
  td {
    @apply p-3 text-left;
  }

  th {
    @apply font-semibold text-sm;
  }

  tr > *:first-child,
  tr > *:last-child {
    @apply text-center;
  }

  tbody tr {
    &:nth-child(2n + 1) {
      background-color: var(--hover-bg-color);
    }

    &:hover {
      @apply cursor-pointer;
      background-color: var(--hover-primary-color);
    }

    &.current {
      background-color: var(--outline-color);
    }
  }
</style>

<TrackDetailsDialogue
  src={openedTrack}
  open={openedTrack !== null}
  on:close={() => (openedTrack = null)} />

{#if tracks}
  <table class={$$restProps.class}>
    <thead>
      <tr>
        <th>{$_('#')}</th>
        <th class={`col-span-${withAlbum ? 3 : 5}`}>{$_('track')}</th>
        <th class={`col-span-${withAlbum ? 3 : 4}`}>{$_('artist')}</th>
        {#if withAlbum}
          <th class="col-span-3">{$_('album')}</th>
        {/if}
        <th>{$_('duration')}</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {#each sortedTracks as track, i (track.id)}
        <tr
          on:click={() => clicks$.next(track)}
          class:current={$current && $current.id === track.id}>
          <td>{(track.tags.track && track.tags.track.no) || '--'}</td>
          <td class={`col-span-${withAlbum ? 3 : 5}`}>{track.tags.title}</td>
          <td class={`col-span-${withAlbum ? 3 : 4}`}>
            {@html wrapWithLink('artist', track.artistRefs[0])}
          </td>
          {#if withAlbum}
            <td class="col-span-3">
              {@html wrapWithLink('album', track.albumRef)}
            </td>
          {/if}
          <td>{formatTime(track.tags.duration)}</td>
          <td on:click|stopPropagation>
            <TrackDropdown
              {track}
              on:showDetails={() => (openedTrack = track)} />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
