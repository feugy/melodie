'use strict'

import Track from './Track.svelte'

export default {
  title: 'Components/Track',
  excludeStories: /.*Data$/
}

export const trackData = {
  media: './cover.jpg',
  src: {
    title: 'Diamonds on the inside',
    artists: ['Ben Harper'],
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
