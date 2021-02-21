'use strict'

import Playlist from './Playlist.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { websocketResponse } from '../../../.storybook/loaders'

const title = 'Components/Playlist'

export default {
  title,
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator],
  loaders: [
    websocketResponse(title, () => ({ ...playlistData, tracks: tracksData }))
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
