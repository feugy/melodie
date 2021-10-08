<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import { BehaviorSubject } from 'rxjs'
  import TracksTable from './TracksTable.svelte'
  import { tracksData } from './TracksTable.testdata'
  import { playlistsData } from '../AddToPlaylist/AddToPlaylist.testdata'
  import { mockWebsocket } from '../../atelier/utils'
  import HRefSink from '../../atelier/HRefSink.svelte'

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
