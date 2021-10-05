<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import Playlist from './Playlist.svelte'
  import { playlistData } from './Playlist.testdata'
  import { tracksData } from '../TracksTable/TracksTable.testdata'
  import { mockWebsocket } from '../../atelier/utils'
  import HRefSink from '../../atelier/HRefSink.svelte'
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
