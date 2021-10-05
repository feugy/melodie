<script>
  import { Tool } from '@atelier-wb/svelte'
  import Component from './playlist.svelte'
  import { mockWebsocket } from '../atelier/utils'
  import HRefSink from '../atelier/HRefSink.svelte'

  const playlistsData = [
    {
      id: 1,
      name: 'My favourites',
      trackIds: [1, 2, 3],
      refs: [
        [1, 'Ben Harper'],
        [2, 'The Innocent Criminals'],
        [1, 'Diamonds on the inside']
      ],
      media: null
    },
    {
      id: 2,
      name: 'Slows',
      trackIds: [4, 5, 6, 7, 8],
      refs: [
        [1, 'Ben Harper'],
        [2, 'The Innocent Criminals'],
        [1, 'Diamonds on the inside']
      ],
      media: null
    },
    {
      id: 3,
      name: 'Rock',
      trackIds: [9],
      refs: [
        [1, 'Ben Harper'],
        [2, 'The Innocent Criminals'],
        [1, 'Diamonds on the inside']
      ],
      media: null
    }
  ]
</script>

<Tool
  name="Views/Playlist"
  setup={mockWebsocket((invoked, playlist, id) =>
    invoked === 'tracks.list'
      ? {
          size: 10,
          from: 0,
          total: playlistsData.length,
          results: playlistsData
        }
      : playlistsData.find(playlists => playlists.id === id)
  )}
  let:props
>
  <HRefSink><Component {...props} /></HRefSink>
</Tool>
