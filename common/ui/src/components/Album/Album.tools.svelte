<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import Album from './Album.svelte'
  import { albumData, manyArtistsData } from './Album.testdata'
  import { tracksData } from '../TracksTable/TracksTable.testdata'
  import { mockWebsocket } from '../../atelier/utils'
  import HRefSink from '../../atelier/HRefSink.svelte'
</script>

<ToolBox
  name="Components/Album"
  setup={mockWebsocket(() => ({ ...albumData, tracks: tracksData }))}
>
  <Tool name="Default" props={{ src: albumData }} let:props>
    <HRefSink><Album {...props} /></HRefSink>
  </Tool>

  <Tool name="Many artists" props={{ src: manyArtistsData }} let:props>
    <HRefSink><Album {...props} /></HRefSink>
  </Tool>

  <Tool name="No artist" props={{ src: { ...albumData, refs: [] } }} let:props>
    <HRefSink><Album {...props} /></HRefSink>
  </Tool>

  <Tool
    name="Unknown"
    props={{ src: { ...albumData, media: null, name: null } }}
    let:props
  >
    <HRefSink><Album {...props} /></HRefSink>
  </Tool>
</ToolBox>
