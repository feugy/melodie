<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import { writable } from 'svelte/store'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../AddToPlaylist/AddToPlaylist.testdata'
  import { albumData } from '../Album/Album.testdata'
  import { artistData } from '../Artist/Artist.testdata'
  import { trackData } from '../Track/Track.testdata'
  import ExpandableList, {
    ALBUMS,
    ARTISTS,
    TRACKS
  } from './ExpandableList.svelte'
</script>

<ToolBox name="Components/Expandable list">
  <Tool
    name="Artists"
    props={{
      kind: ARTISTS,
      items: writable(
        Array.from({ length: 5 }, (_, id) => ({ ...artistData, id }))
      )
    }}
    setup={mockWebsocket(() => artistData)}
    let:props
  >
    <HRefSink>
      <div class="max-w-900px"><ExpandableList {...props} /></div>
    </HRefSink>
  </Tool>

  <Tool
    name="Albums"
    props={{
      kind: ALBUMS,
      items: writable(
        Array.from({ length: 5 }, (_, id) => ({ ...albumData, id }))
      )
    }}
    setup={mockWebsocket(() => albumData)}
    let:props
  >
    <HRefSink>
      <div class="max-w-900px">
        <ExpandableList {...props} />
        <div />
      </div></HRefSink
    >
  </Tool>

  <Tool
    name="Tracks"
    props={{
      kind: TRACKS,
      items: writable(
        Array.from({ length: 5 }, (_, id) => ({ ...trackData, id }))
      )
    }}
    setup={mockWebsocket(() => ({
      total: playlistsData.length,
      size: playlistsData.length,
      from: 0,
      results: playlistsData
    }))}
    let:props
  >
    <HRefSink>
      <div class="max-w-900px">
        <ExpandableList {...props} />
        <div />
      </div></HRefSink
    >
  </Tool>
</ToolBox>
