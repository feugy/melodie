'use strict'

import { action } from '@storybook/addon-actions'
import Artist from './Artist.stories.svelte'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Artist',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const artistData = {
  name: 'Foo Fighters',
  linked: ['Concrete And Gold', 'Sonic Highways'],
  media: './avatar.jpg'
}

export const actionsData = {
  play: action('on artist play'),
  enqueue: action('on artist enqueue')
}

export const Default = () => ({
  Component: Artist,
  props: {
    src: artistData
  },
  on: actionsData
})

export const NoAlbums = () => ({
  Component: Artist,
  props: {
    src: {
      ...artistData,
      linked: []
    }
  },
  on: actionsData
})
