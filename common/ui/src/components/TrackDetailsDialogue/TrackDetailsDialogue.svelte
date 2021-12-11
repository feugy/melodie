<script>
  import { _ } from 'svelte-intl'
  import Dialogue from '../Dialogue/Dialogue.svelte'
  import { formatTime } from '../../utils'

  export let src
  export let open
  let values = []
  const collator = new Intl.Collator([], { numeric: true })
  // see here: https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md
  const ignored = new Set([
    'artist',
    'movementIndex',
    'movement',
    'movementTotal',
    'rating',
    'albumsort',
    'titlesort',
    'artistsort',
    'composersort',
    'lyrics',
    'originalartist',
    'originalalbum',
    'originaldate',
    'originalyear',
    'totaltracks',
    'totaldisks',
    'compilation',
    'media',
    'encodersettings',
    'gapless',
    'barcode',
    'averageLevel',
    'peakLevel',
    'hdVideo'
  ])
  const ignoredStart = /^(discogs_|musicbrainz_|replaygain_|release)/

  $: if (src && src.tags) {
    values = []
    const keys = Object.keys(src.tags)
    for (const key of keys) {
      let value = src.tags[key]
      if (key === 'disk' || key === 'track') {
        value =
          value.no == null
            ? null
            : value.of == null
            ? value.no
            : `${value.no}/${value.of}`
      } else if (key === 'duration') {
        value = formatTime(value)
      }
      if (value && !key.match(ignoredStart) && !ignored.has(key)) {
        values.push({ key, label: $_(`tags.${key}`), value })
      }
    }
    values.push(
      { key: 'id', label: $_('id'), value: src.id },
      { key: 'path', label: $_('path'), value: src.path }
    )
    values.sort((a, b) => collator.compare(a.label, b.label))
  }
</script>

<style lang="postcss">
  table {
    @apply w-full border-collapse text-left;
  }

  td {
    @apply p-2;
  }

  tr > td:first-child {
    @apply text-right font-semibold text-sm;
  }

  tr:nth-child(2n) {
    background-color: var(--hover-bg-color);
  }
</style>

<Dialogue title={$_('track details')} bind:open>
  <div slot="content">
    <table>
      {#each values as { key, label, value } (key)}
        <tr>
          <td class="label">{label}</td>
          <td class="value">{value}</td>
        </tr>
      {/each}
    </table>
  </div>
</Dialogue>
