'use strict'

import Component from './album.svelte'
import { websocketResponse } from '../../.storybook/loaders'

export const albumsData = [
  {
    id: 1,
    name: '100 Best Karajan',
    trackIds: [1, 2, 3],
    refs: [
      [1, 'Émile Waldteufel'],
      [2, 'Johann Sebastian Bach'],
      [3, 'Wolfgang Amadeus Mozart'],
      [4, 'Ottorino Respighi'],
      [5, 'Ludwig van Beethoven'],
      [6, 'Giuseppe Verdi']
    ],
    media: null
  },
  {
    id: 2,
    name: 'Black Orpheus',
    trackIds: [4, 5, 6, 7, 8],
    refs: [[7, 'Keziah Jones']],
    media: 'cover.jpg'
  },
  {
    id: 3,
    name: 'Distant Worlds - Music from Final Fantasy',
    trackIds: [9],
    refs: [[8, 'Nobuo Uematsu']],
    media: null
  }
]

const title = 'Views/Albums'

export default {
  title,
  excludeStories: /.*Data$/,
  loaders: [
    websocketResponse(title, () => ({
      size: 10,
      from: 0,
      total: albumsData.length,
      results: albumsData
    }))
  ],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({ Component })
