'use strict'

import Component from './[searched].svelte'
import { websocketResponse } from '../../../.storybook/loaders'
import { artistsData } from '../artist.stories'
import { albumsData } from '../album.stories'
import { disksData } from '../../components/DisksList/DisksList.stories'

export default {
  title: 'Views/Search Results',
  loaders: [
    websocketResponse(() => ({
      totals: {
        albums: albumsData.length,
        artists: artistsData.length,
        tracks: disksData.length
      },
      totalSum: albumsData.length + artistsData.length + disksData.length,
      size: 1000,
      from: 0,
      albums: albumsData,
      artists: artistsData,
      tracks: disksData
    }))
  ],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({
  Component,
  props: { params: { searched: encodeURIComponent('Final Fantasy VII') } }
})
