'use strict'

import Component from './[id].svelte'
import { websocketResponse } from '../../../.storybook/loaders'
import { disksData } from '../../components/DisksList/DisksList.stories'

const album = {
  id: 1,
  name: 'Cowboy Bebop - Blue',
  trackIds: disksData.map(({ id }) => id),
  refs: [
    [1, 'Yoko Kano'],
    [2, 'The Seatbelts']
  ],
  tracks: disksData,
  media: 'cover.jpg'
}

const title = 'Views/Album Details'

export default {
  title,
  loaders: [websocketResponse(title, () => album)],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({
  Component,
  props: { params: { id: album.id } }
})
