'use strict'

import AddToPlaylist from './AddToPlaylist.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import { websocketResponse } from '../../../.storybook/loaders'

export default {
  title: 'Components/AddToPlaylist',
  excludeStories: /.*Data$/,
  loaders: [
    websocketResponse(() => ({
      total: playlistsData.length,
      size: playlistsData.length,
      from: 0,
      results: playlistsData
    }))
  ]
}

export const playlistsData = [
  {
    id: 1,
    name: 'Awesome mix, vol. 1',
    trackIds: [10, 20]
  },
  {
    id: 2,
    name: 'Classical favourites',
    trackIds: [10, 30]
  },
  {
    id: 3,
    name: 'Awesome mix, vol. 2',
    trackIds: [40, 50]
  },
  {
    id: 4,
    name: 'Rock',
    trackIds: [10]
  },
  {
    id: 5,
    name: 'Slow',
    trackIds: [20]
  },
  {
    id: 6,
    name: 'Disco',
    trackIds: [30]
  },
  {
    id: 5,
    name: 'Classical',
    trackIds: [40]
  },
  {
    id: 6,
    name: 'Favorites',
    trackIds: [50]
  },
  {
    id: 7,
    name: 'Original Sound Tracks',
    trackIds: [10, 20, 30]
  },
  {
    id: 8,
    name: 'Guitar Heroes',
    trackIds: [20, 30, 40]
  },
  {
    id: 9,
    name: 'For kids',
    trackIds: [30, 40, 50]
  },
  {
    id: 10,
    name: 'Instrumental',
    trackIds: [10, 30]
  }
]

export const Default = () => ({
  Component: AddToPlaylist,
  props: {
    tracks: tracksData
  }
})
