<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import Artist from './Artist.svelte'
  import { artistData } from './Artist.testdata'
  import { tracksData } from '../TracksTable/TracksTable.testdata'
  import { mockWebsocket } from '../../atelier/utils'
  import HRefSink from '../../atelier/HRefSink.svelte'
</script>

<ToolBox
  name="Components/Artist"
  setup={mockWebsocket(() => ({ ...artistData, tracks: tracksData }))}
>
  <Tool name="Default" props={{ src: artistData }} let:props>
    <HRefSink><Artist {...props} /></HRefSink>
  </Tool>

  <Tool name="No album" props={{ src: { ...artistData, refs: [] } }} let:props>
    <HRefSink><Artist {...props} /></HRefSink>
  </Tool>

  <Tool
    name="Unknown"
    props={{ src: { ...artistData, media: null, name: null } }}
    let:props
  >
    <HRefSink><Artist {...props} /></HRefSink>
  </Tool>
</ToolBox>
