'use strict'

import Track from './Track.svelte'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Track',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const trackData = {
  media: './cover.jpg',
  src: {
    title: 'Mama got a girlfriend',
    artists: ['Ben Harper'],
    album: 'Diamonds on the inside',
    duration: 125.78
  }
}

export const Default = () => ({
  Component: Track,
  props: trackData
})

export const WithDetails = () => ({
  Component: Track,
  props: {
    ...trackData,
    details: true
  }
})
