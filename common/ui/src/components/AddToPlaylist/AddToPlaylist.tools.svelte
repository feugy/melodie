<script>
  import { Tool } from '@atelier-wb/svelte'

  import { mockWebsocket } from '../../atelier/utils'
  import { tracksData } from '../TracksTable/TracksTable.testdata'
  import AddToPlaylist from './AddToPlaylist.svelte'
  import { playlistsData } from './AddToPlaylist.testdata'
</script>

<Tool
  name="Components/Add to playlist"
  component={AddToPlaylist}
  props={{ tracks: tracksData }}
  events={['close', 'select']}
  setup={mockWebsocket(() => ({
    total: playlistsData.length,
    size: playlistsData.length,
    from: 0,
    results: playlistsData
  }))}
/>
