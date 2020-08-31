'use strict'

import AddToPlaylist from './AddToPlaylist.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import { ipcRendererMock } from '../../../.storybook/decorators'
import { list } from '../../stores/playlists'

export default {
  title: 'Components/AddToPlaylist',
  excludeStories: /.*Data$/,
  decorators: [
    ipcRendererMock(() => ({
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
  }
]

export const Default = () => {
  list()
  return {
    Component: AddToPlaylist,
    props: {
      tracks: tracksData
    }
  }
}
