'use strict'

import Component from './playlist.svelte'
import { websocketResponse } from '../../.storybook/loaders'

const playlists = [
  {
    id: 1,
    name: 'My favourites',
    trackIds: [1, 2, 3],
    refs: [
      [1, 'Ben Harper'],
      [2, 'The Innocent Criminals'],
      [1, 'Diamonds on the inside']
    ],
    media: null
  },
  {
    id: 2,
    name: 'Slows',
    trackIds: [4, 5, 6, 7, 8],
    refs: [
      [1, 'Ben Harper'],
      [2, 'The Innocent Criminals'],
      [1, 'Diamonds on the inside']
    ],
    media: null
  },
  {
    id: 3,
    name: 'Rock',
    trackIds: [9],
    refs: [
      [1, 'Ben Harper'],
      [2, 'The Innocent Criminals'],
      [1, 'Diamonds on the inside']
    ],
    media: null
  }
]

export default {
  title: 'Views/Playlist',
  loaders: [
    websocketResponse(() => ({
      size: 10,
      from: 0,
      total: playlists.length,
      results: playlists
    }))
  ],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({ Component })
