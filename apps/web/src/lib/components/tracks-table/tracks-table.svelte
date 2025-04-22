<script module lang="ts">
  import type { Track } from '@melodie/common/models'

  export interface TracksTableProps {
    tracks: Track[]
    current?: Track
    hideAlbum?: boolean
    class?: string
    onclick?: (idx: number, track: Track) => void
  }
</script>

<script lang="ts">
  import { t } from 'svelte-intl-precompile'
  import { formatTime, wrapWithLink } from '$lib/utils'
  let {
    tracks,
    current,
    hideAlbum = false,
    class: className,
    onclick,
  }: TracksTableProps = $props()

  let sortedTracks = $derived(
    tracks
      ? tracks
          .concat()
          .sort(
            (a, b) =>
              (a.tags.track?.no ?? Number.POSITIVE_INFINITY) -
              (b.tags.track?.no ?? Number.POSITIVE_INFINITY)
          )
      : []
  )
</script>

{#if tracks}
  <table
    class="{className} mt-4 block w-full overflow-x-auto [&_td]:block [&_td]:p-2 [&_th]:block [&_th]:p-2 [&_tr]:grid [&_tr]:grid-cols-[60px_repeat(10,1fr)_60px] [&_tr]:items-center [&_tr]:gap-0 [&>tbody]:block [&>tbody]:min-w-[600px] [&>thead]:block [&>thead]:min-w-[600px]"
  >
    <thead>
      <tr class="text-left text-sm font-semibold">
        <th class="text-center">{$t('#')}</th>
        <th class={hideAlbum ? 'col-span-5' : 'col-span-3'}>{$t('track')}</th>
        <th class={hideAlbum ? 'col-span-4' : 'col-span-3'}>{$t('artist')}</th>
        {#if !hideAlbum}
          <th class="col-span-3">{$t('album')}</th>
        {/if}
        <th>{$t('duration')}</th>
        <th class=""></th>
      </tr>
    </thead>
    <tbody class="">
      {#each sortedTracks as track, idx (track.id)}
        <tr
          class:current={current?.id === track.id}
          class="odd:preset-filled-primary-800-200 hover:preset-filled-secondary-300-700 grid items-center gap-0 hover:cursor-pointer"
          onclick={() => onclick?.(idx, track)}
        >
          <td class="w-[60px] text-center"
            >{(track.tags.track && track.tags.track.no) || '--'}</td
          >
          <td class={hideAlbum ? 'col-span-5' : 'col-span-3'}
            >{track.tags.title}</td
          >
          <td class={hideAlbum ? 'col-span-4' : 'col-span-3'}>
            {@html track.artistRefs
              ?.map((artist) => wrapWithLink('artist', artist))
              .join(', ')}
          </td>
          {#if !hideAlbum}
            <td class="col-span-3">
              {@html wrapWithLink('album', track.albumRef)}
            </td>
          {/if}
          <td>{formatTime(track.tags.duration)}</td>
          <td class="w-[60px]"></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
