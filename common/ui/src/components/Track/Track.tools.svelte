<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../AddToPlaylist/AddToPlaylist.testdata'
  import Track from './Track.svelte'
  import { trackData } from './Track.testdata'
</script>

<ToolBox
  name="Components/Track"
  props={{ src: trackData }}
  setup={mockWebsocket(() => ({
    total: playlistsData.length,
    size: playlistsData.length,
    from: 0,
    results: playlistsData
  }))}
>
  <Tool name="Default" let:props>
    <HRefSink>
      <Track {...props} />
    </HRefSink>
  </Tool>
  <Tool name="With details" props={{ details: true }} let:props>
    <HRefSink>
      <Track {...props} />
    </HRefSink>
  </Tool>
  <Tool name="With menu" props={{ withMenu: true }} let:props>
    <HRefSink>
      <Track {...props} />
    </HRefSink>
  </Tool>
</ToolBox>
