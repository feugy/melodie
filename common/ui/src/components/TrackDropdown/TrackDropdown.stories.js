'use strict'

import { action } from '@storybook/addon-actions'
import TrackDropdown from './TrackDropdown.svelte'
import { websocketResponse } from '../../../.storybook/loaders'
import { list } from '../../stores/playlists'

export default {
  title: 'Components/Track Dropdown',
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
  }
]

export const Default = () => {
  list()
  return {
    Component: TrackDropdown,
    props: {
      track: { id: 1, path: 'whatever' },
      additionalOptions: [
        { label: 'Custom item', icon: 'close', act: action('on custom item') }
      ]
    },
    on: {
      showDetails: action('on show track details')
    }
  }
}
