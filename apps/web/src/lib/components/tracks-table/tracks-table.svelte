<script module lang="ts">
  import type { Track } from '@melodie/common/models'

  export interface TracksTableProps {
    tracks: Track[]
    current?: Track
    hideAlbum?: boolean
    displayIndex?: boolean
    class?: string
    onclick?: (idx: number, track: Track) => void
  }
</script>

<script lang="ts">
  import { t } from 'svelte-intl-precompile'
  import { formatTime, wrapWithLink } from '$lib/utils'
  import { sortByNum } from '$lib/utils/tracks'
  let {
    tracks,
    current,
    hideAlbum = false,
    displayIndex = false,
    class: className,
    onclick,
  }: TracksTableProps = $props()

  let sortedTracks = $derived(displayIndex ? sortByNum(tracks) : tracks)

  function handleClick(e: Event, idx: number, track: Track) {
    if ((e.target as HTMLElement).nodeName === 'A') return
    onclick?.(idx, track)
  }
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
      {#each sortedTracks as track, idx (`${track.id}:${idx}`)}
        <tr
          class:current={current?.id === track.id}
          class="odd:preset-filled-primary-950-50 hover:border-l-primary-500 grid items-center gap-0 border-l-4 border-l-transparent hover:cursor-pointer"
          onclick={(e) => handleClick(e, idx, track)}
        >
          <td class="w-[50px] text-center"
            >{displayIndex ? idx + 1 : (track.tags.track && track.tags.track.no) || '--'}</td
          >
          <td class={hideAlbum ? 'col-span-5' : 'col-span-3'}
            >{track.tags.title}</td
          >
          <td class={hideAlbum ? 'col-span-4' : 'col-span-3'}>
            {@html track.artistRefs
              ?.map((artist) => wrapWithLink('artists', artist))
              .join(', ')}
          </td>
          {#if !hideAlbum}
            <td class="col-span-3">
              {@html wrapWithLink('albums', track.albumRef)}
            </td>
          {/if}
          <td>{formatTime(track.tags.duration)}</td>
          <td class="w-[60px]"></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
