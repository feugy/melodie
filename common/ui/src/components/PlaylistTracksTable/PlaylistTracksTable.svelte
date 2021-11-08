<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import TrackDropdown from '../TrackDropdown/TrackDropdown.svelte'
  import SortableList from '../SortableList/SortableList.svelte'
  import Track from '../Track/Track.svelte'
  import TrackDetailsDialogue from '../TrackDetailsDialogue/TrackDetailsDialogue.svelte'
  import { wrapWithLink } from '../../utils'
  import { createClickToAddObservable } from '../../stores/track-queue'
  import { removeTrack, moveTrack } from '../../stores/playlists'

  export let playlist
  let openedTrack = null

  const clicks$ = createClickToAddObservable()

  onMount(() => clicks$.subscribe())
</script>

<style lang="postcss">
  table,
  tbody,
  thead,
  tr,
  td,
  th {
    @apply block;
  }

  table {
    @apply w-full mt-4 overflow-x-auto;
  }

  tbody,
  thead {
    min-width: 600px;
  }

  tr {
    @apply grid gap-0 items-center;
    grid-template-columns: 60px repeat(10, 1fr) 60px;

    & > *:first-child,
    & > *:last-child {
      @apply text-center;
    }
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

    &:nth-child(3) {
      @apply text-right;
    }
  }

  tbody > * > *:nth-child(2n + 1) {
    background-color: var(--hover-bg-color);
  }
</style>

<TrackDetailsDialogue
  src={openedTrack}
  open={openedTrack !== null}
  on:close={() => (openedTrack = null)}
/>

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
        on:move={({ detail }) => moveTrack(playlist, detail)}
      >
        <tr slot="item" let:item let:i on:click={() => clicks$.next(item)}>
          <td>{i + 1}</td>
          <td class="col-span-6">
            <Track src={item} details="true" />
          </td>
          <td class="col-span-4">
            {@html wrapWithLink('album', item.albumRef)}
          </td>
          <td on:click|stopPropagation>
            <TrackDropdown
              track={item}
              additionalOptions={[
                {
                  label: $_('remove from playlist'),
                  icon: 'close',
                  act: () => removeTrack(playlist, i)
                }
              ]}
              on:showDetails={() => (openedTrack = item)}
            />
          </td>
        </tr>
      </SortableList>
    </tbody>
  </table>
{/if}
