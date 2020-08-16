'use strict'

import Album from './Album.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'
import { hash } from '../../utils'

export default {
  title: 'Components/Album',
  excludeStories: /.*Data$/,
  decorators: [
    hrefSinkDecorator,
    ipcRendererMock(() => ({ ...albumData, tracks: tracksData }))
  ]
}

export const albumData = {
  id: hash('Diamonds on the inside'),
  name: 'Diamonds on the inside',
  linked: ['Ben Harper', 'The Innocent Criminals'],
  media: './cover.jpg'
}

export const manyArtistsData = {
  id: hash('Diamonds on the inside'),
  name: 'Diamonds on the inside',
  linked: ['Muse', 'Perl Jam', 'Joe Satriani', 'Avenged Sevenfold'],
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
      linked: []
    }
  }
})
