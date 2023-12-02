<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import * as queue from '../../stores/track-queue'
  import { trackListData } from '../Player/Player.testdata'
  import TracksQueue from './TracksQueue.svelte'
</script>

<ToolBox
  name="Components/Tracks queue"
  setup={async () => {
    await mockWebsocket(() => ({ results: [], total: 0 }))()
    queue.clear()
  }}
>
  <Tool name="Empty" let:props>
    <HRefSink>
      <TracksQueue {...props} />
    </HRefSink>
  </Tool>

  <Tool
    name="With track list"
    setup={() => {
      queue.add(trackListData)
      queue.add(trackListData)
    }}
    let:props
  >
    <HRefSink>
      <TracksQueue {...props} />
    </HRefSink>
  </Tool>
</ToolBox>
