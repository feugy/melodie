<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { tracksData } from '../TracksTable/TracksTable.testdata'
  import Playlist from './Playlist.svelte'
  import { playlistData } from './Playlist.testdata'
</script>

<ToolBox
  name="Components/Playlist"
  props={{ src: playlistData }}
  setup={mockWebsocket(() => ({ ...playlistData, tracks: tracksData }))}
>
  <Tool name="Default" let:props>
    <HRefSink><Playlist {...props} /></HRefSink>
  </Tool>

  <Tool
    name="Single track"
    props={{ src: { ...playlistData, trackIds: [123456] } }}
    let:props
  >
    <HRefSink><Playlist {...props} /></HRefSink>
  </Tool>
</ToolBox>
