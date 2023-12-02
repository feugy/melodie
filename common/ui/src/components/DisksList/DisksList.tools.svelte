<script>
  import { Tool } from '@atelier-wb/svelte'
  import { BehaviorSubject } from 'rxjs'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../AddToPlaylist/AddToPlaylist.testdata'
  import DisksList from './DisksList.svelte'
  import { disksData } from './DisksList.testdata'

  export const current = new BehaviorSubject(disksData[3])
</script>

<Tool
  name="Components/Disks list"
  props={{ tracks: disksData, current: current }}
  events={['close', 'open']}
  setup={mockWebsocket(() => ({
    total: playlistsData.length,
    size: playlistsData.length,
    from: 0,
    results: playlistsData
  }))}
  let:props
>
  <HRefSink><DisksList {...props} /></HRefSink>
</Tool>
