<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import { mockWebsocket } from '../../atelier/utils'
  import * as queue from '../../stores/track-queue'
  import Player from './Player.svelte'
  import { trackListData } from './Player.testdata'
</script>

<ToolBox
  name="Components/Player"
  component={Player}
  setup={async () => {
    await mockWebsocket(() => ({ totals: 0, results: [] }))()
    queue.clear()
  }}
>
  <Tool name="Empty" />

  <Tool
    name="With track list"
    layout="centered"
    setup={() => {
      queue.add(trackListData)
    }}
  />
</ToolBox>
