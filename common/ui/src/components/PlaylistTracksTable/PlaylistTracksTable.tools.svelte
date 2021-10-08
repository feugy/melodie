<script>
  import { Tool } from '@atelier-wb/svelte'
  import PlaylistTracksTable from './PlaylistTracksTable.svelte'
  import { disksData } from '../DisksList/DisksList.testdata'
  import { playlistsData } from '../AddToPlaylist/AddToPlaylist.testdata'
  import { mockWebsocket } from '../../atelier/utils'
  import HRefSink from '../../atelier/HRefSink.svelte'

  const playlistData = {
    id: 1,
    name: 'My favourites',
    refs: [
      [1, 'Ben Harper'],
      [2, 'The Innocent Criminals'],
      [1, 'Diamonds on the inside']
    ],
    media: null,
    tracks: disksData.map((track, i) => ({
      ...track,
      tags: {
        ...track.tags,
        track: { no: i + 1 }
      }
    }))
  }
  playlistData.trackIds = playlistData.tracks.map(({ id }) => id)
</script>

<Tool
  name="Components/Playlist tracks table"
  props={{ playlist: playlistData }}
  setup={mockWebsocket(() => ({
    total: playlistsData.length,
    size: playlistsData.length,
    from: 0,
    results: playlistsData
  }))}
  let:props
  let:handleEvent
>
  <HRefSink><PlaylistTracksTable {...props} /></HRefSink>
</Tool>
