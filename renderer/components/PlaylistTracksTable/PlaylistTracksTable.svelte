<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Dropdown from '../Dropdown/Dropdown.svelte'
  import SortableList from '../SortableList/SortableList.svelte'
  import Track from '../Track/Track.svelte'
  import TrackDetailsDialogue from '../TrackDetailsDialogue/TrackDetailsDialogue.svelte'
  import {
    wrapWithLink,
    createClickObservable,
    openContainingFolder
  } from '../../utils'
  import { add } from '../../stores/track-queue'
  import { removeTrack, moveTrack } from '../../stores/playlists'

  export let playlist
  let openedTrack = null

  // play on double click, enqueue on simple
  const clicks$ = createClickObservable(
    track => add(track),
    track => add(track, true)
  )

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
    @apply grid gap-0 items-center;
    grid-template-columns: 60px repeat(10, 1fr) 60px;
  }

  thead {
    border-bottom: solid 2px var(--outline-color);
  }

  th,
  td {
    @apply p-3 text-left;
  }

  th:nth-child(3) {
    @apply text-right;
  }

  th {
    @apply font-semibold text-sm;
  }

  tr > *:first-child,
  tr > *:last-child {
    @apply text-center;
  }

  tbody > * > *:nth-child(2n + 1) {
    background-color: var(--hover-bg-color);
  }
</style>

<TrackDetailsDialogue
  src={openedTrack}
  open={openedTrack !== null}
  on:close={() => (openedTrack = null)} />

{#if playlist && playlist.tracks}
  <table>
    <thead>
      <tr>
        <th>{$_('#')}</th>
        <th class="col-span-5">{$_('track')}</th>
        <th class="col-span-1">{$_('duration')}</th>
        <th class="col-span-4">{$_('album')}</th>
        <th />
      </tr>
    </thead>
    <tbody>
      <SortableList
        items={playlist.tracks}
        on:move={({ detail }) => moveTrack(playlist, detail)}>
        <tr slot="item" let:item let:i on:click={() => clicks$.next(item)}>
          <td>{i + 1}</td>
          <td class="col-span-6">
            <Track src={item} details="true" />
          </td>
          <td class="col-span-4">
            {@html wrapWithLink('album', item.albumRef)}
          </td>
          <td on:click|stopPropagation>
            <Dropdown
              on:select={({ detail }) => detail.act()}
              icon="more_vert"
              noBorder={true}
              withArrow={false}
              valueAsText={false}
              options={[{ label: $_('remove from playlist'), icon: 'close', act: () => removeTrack(playlist, i) }, { label: $_('play now'), icon: 'play_arrow', act: () => add(item, true) }, { label: $_('enqueue'), icon: 'playlist_add', act: () => add(item) }, { label: $_('show details'), icon: 'local_offer', act: () => (openedTrack = item) }, { label: $_('open folder'), icon: 'launch', act: () => openContainingFolder(item) }]} />
          </td>
        </tr>
      </SortableList>
    </tbody>
  </table>
{/if}
