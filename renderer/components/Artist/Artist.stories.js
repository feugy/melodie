'use strict'

import Artist from './Artist.svelte'
import { tracksData } from '../TracksTable/TracksTable.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'

export default {
  title: 'Components/Artist',
  excludeStories: /.*Data$/,
  decorators: [
    hrefSinkDecorator,
    ipcRendererMock(() => ({ ...artistData, tracks: tracksData }))
  ]
}

export const artistData = {
  id: 1,
  name: 'Foo Fighters',
  refs: [
    [1, 'Concrete And Gold'],
    [2, 'Sonic Highways']
  ],
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
      refs: []
    }
  }
})
