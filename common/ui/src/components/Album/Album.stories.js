'use strict'

import Album from './Album.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { websocketResponse } from '../../../.storybook/loaders'

const title = 'Components/Album'

export default {
  title,
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator],
  loaders: [
    websocketResponse(title, () => ({ ...albumData, tracks: tracksData }))
  ]
}

export const albumData = {
  id: 1,
  name: 'Diamonds on the inside',
  refs: [
    [1, 'Ben Harper'],
    [2, 'The Innocent Criminals']
  ],
  media: './cover.jpg'
}

export const manyArtistsData = {
  id: 2,
  name: 'Diamonds on the inside',
  refs: [
    [3, 'Muse'],
    [4, 'Perl Jam'],
    [4, 'Joe Satriani'],
    [6, 'Avenged Sevenfold']
  ],
  media: './cover.jpg'
}

export const Default = () => ({
  Component: Album,
  props: {
    src: albumData
  }
})

export const ManyArtists = () => ({
  Component: Album,
  props: {
    src: manyArtistsData
  }
})

export const NoArtist = () => ({
  Component: Album,
  props: {
    src: {
      ...albumData,
      refs: []
    }
  }
})

export const Unknown = () => ({
  Component: Album,
  props: {
    src: {
      ...albumData,
      media: null,
      name: null
    }
  }
})
