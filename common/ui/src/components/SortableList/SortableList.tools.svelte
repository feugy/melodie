<script>
  import { Tool } from '@atelier-wb/svelte'
  import SortableList from './SortableList.test.svelte'
  import { trackListData } from '../Player/Player.testdata'
  import HRefSink from '../../atelier/HRefSink.svelte'
</script>

<Tool
  name="Components/Sortable list"
  props={{
    items: [...trackListData, ...trackListData]
  }}
  let:props
  let:handleEvent
>
  <HRefSink>
    <SortableList
      {...props}
      on:move={handleEvent}
      on:click={handleEvent}
      on:remove={handleEvent}
    />
  </HRefSink>
</Tool>
