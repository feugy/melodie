<script>
  import { Tool } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../../components/AddToPlaylist/AddToPlaylist.testdata'
  import { disksData } from '../../components/DisksList/DisksList.testdata'
  import Component from './[id].svelte'
</script>

<Tool
  name="Views/Playlist Details"
  props={{ params: { id: playlistsData[0].id } }}
  setup={mockWebsocket(invoked =>
    invoked === 'tracks.list'
      ? {
          total: playlistsData.length,
          size: playlistsData.length,
          from: 0,
          results: playlistsData
        }
      : {
          ...playlistsData[0],
          trackIds: disksData.map(({ id }) => id),
          tracks: disksData
        }
  )}
  let:props
>
  <HRefSink><Component {...props} /></HRefSink>
</Tool>
