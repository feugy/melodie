<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import { BehaviorSubject } from 'rxjs'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../AddToPlaylist/AddToPlaylist.testdata'
  import TracksTable from './TracksTable.svelte'
  import { tracksData } from './TracksTable.testdata'

  const current = new BehaviorSubject(tracksData[3])
</script>

<ToolBox
  name="Components/Tracks table"
  setup={mockWebsocket(() => ({
    total: playlistsData.length,
    size: playlistsData.length,
    from: 0,
    results: playlistsData
  }))}
  props={{ tracks: tracksData, current: null }}
>
  <Tool name="Default" let:props>
    <HRefSink>
      <TracksTable {...props} />
    </HRefSink>
  </Tool>

  <Tool name="Without abum" props={{ withAlbum: false }} let:props>
    <HRefSink>
      <TracksTable {...props} />
    </HRefSink>
  </Tool>

  <Tool name="With current" props={{ current }} let:props>
    <HRefSink>
      <TracksTable {...props} />
    </HRefSink>
  </Tool>
</ToolBox>
