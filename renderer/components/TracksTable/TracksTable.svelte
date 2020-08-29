<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import {
    formatTime,
    wrapWithLink,
    createClickObservable,
    openContainingFolder
  } from '../../utils'
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
    @apply p-3 text-left;
  }

  th {
    @apply font-semibold pt-0 pr-0 text-sm;
  }

  tr > *:first-child,
  tr > *:last-child {
    @apply text-center;
    width: 60px;
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
        <th />
      </tr>
    </thead>
    <tbody>
      {#each sortedTracks as track, i (track.id)}
        <tr
          on:click={() => clicks$.next(track)}
          class:current={$current && $current.id === track.id}>
          <td>{(track.tags.track && track.tags.track.no) || '--'}</td>
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
          <td on:click|stopPropagation>
            <Dropdown
              on:select={({ detail }) => detail.act()}
              icon="more_vert"
              noBorder={true}
              withArrow={false}
              valueAsText={false}
              options={[{ label: $_('play now'), icon: 'play_arrow', act: () => add(track, true) }, { label: $_('enqueue'), icon: 'playlist_add', act: () => add(track) }, { label: $_('open folder'), icon: 'launch', act: () => openContainingFolder(track) }]} />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
