'use strict'

import Playlist from './Playlist.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'

export default {
  title: 'Components/Playlist',
  excludeStories: /.*Data$/,
  decorators: [
    hrefSinkDecorator,
    ipcRendererMock(() => ({ ...playlistData, tracks: tracksData }))
  ]
}

export const playlistData = {
  id: 1,
  name: 'My favourites',
  trackIds: [123456, 654321, 987456],
  refs: [
    [1, 'Ben Harper'],
    [2, 'The Innocent Criminals'],
    [1, 'Diamonds on the inside']
  ],
  media: null
}

export const Default = () => ({
  Component: Playlist,
  props: {
    src: playlistData
  }
})

export const SingleTrack = () => ({
  Component: Playlist,
  props: {
    src: {
      ...playlistData,
      trackIds: [123456]
    }
  }
})
