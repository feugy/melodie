'use strict'

import Component from './[id].svelte'
import { websocketResponse } from '../../../.storybook/loaders'
import { playlistData } from '../../components/Playlist/Playlist.stories'
import { disksData } from '../../components/DisksList/DisksList.stories'

const title = 'Views/Playlist Details'

export default {
  title,
  loaders: [
    websocketResponse(title, () => ({ ...playlistData, tracks: disksData }))
  ],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({
  Component,
  props: { params: { id: playlistData.id } }
})
