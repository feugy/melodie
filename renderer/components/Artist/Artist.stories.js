'use strict'

import { action } from '@storybook/addon-actions'
import Artist from './Artist.svelte'

export default {
  title: 'Components/Artist',
  excludeStories: /.*Data$/
}

export const artistData = {
  name: 'Foo Fighters',
  linked: ['Concrete And Gold', 'Sonic Highways'],
  media: './avatar.jpg'
}

export const actionsData = {
  select: action('on artist select'),
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
