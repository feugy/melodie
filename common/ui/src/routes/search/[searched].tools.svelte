<script>
  import { Tool } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../../components/AddToPlaylist/AddToPlaylist.testdata'
  import { disksData } from '../../components/DisksList/DisksList.testdata'
  import { albumsData } from '../album.testdata'
  import { artistsData } from '../artist.testdata'
  import Component from './[searched].svelte'
</script>

<Tool
  name="Views/Search Results"
  props={{ params: { searched: encodeURIComponent('Final Fantasy VII') } }}
  setup={mockWebsocket(invoked =>
    invoked === 'tracks.list'
      ? {
          total: playlistsData.length,
          size: playlistsData.length,
          from: 0,
          results: playlistsData
        }
      : {
          totals: {
            albums: albumsData.length,
            artists: artistsData.length,
            tracks: disksData.length
          },
          totalSum: albumsData.length + artistsData.length + disksData.length,
          size: 1000,
          from: 0,
          albums: albumsData,
          artists: artistsData,
          tracks: disksData
        }
  )}
  let:props
>
  <div class="w-99vw"><HRefSink><Component {...props} /></HRefSink></div>
</Tool>
