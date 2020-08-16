'use strict'

import Artist from './Artist.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'
import { hash } from '../../utils'

export default {
  title: 'Components/Artist',
  excludeStories: /.*Data$/,
  decorators: [
    hrefSinkDecorator,
    ipcRendererMock(() => ({ ...artistData, tracks: tracksData }))
  ]
}

export const artistData = {
  id: hash('Foo Fighters'),
  name: 'Foo Fighters',
  linked: ['Concrete And Gold', 'Sonic Highways'],
  media: './avatar.jpg'
}

export const Default = () => ({
  Component: Artist,
  props: {
    src: artistData
  }
})

export const NoAlbums = () => ({
  Component: Artist,
  props: {
    src: {
      ...artistData,
      linked: []
    }
  }
})
