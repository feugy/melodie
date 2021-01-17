'use strict'

import Component from './[id].svelte'
import { websocketResponse } from '../../../.storybook/loaders'
import { playlistData } from '../../components/Playlist/Playlist.stories'
import { disksData } from '../../components/DisksList/DisksList.stories'

export default {
  title: 'Views/Playlist Details',
  loaders: [websocketResponse(() => ({ ...playlistData, tracks: disksData }))],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({
  Component,
  props: { params: { id: playlistData.id } }
})
