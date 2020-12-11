'use strict'

import Track from './Track.svelte'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Track',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

const album = 'Diamonds on the inside'
const artists = ['Ben Harper']
const albumRef = [1, album]
const artistRefs = artists.map((artist, id) => [id, artist])

export const trackData = {
  media: './cover.jpg',
  tags: { title: 'Mama got a girlfriend', artists, album, duration: 125.78 },
  albumRef,
  artistRefs
}

export const Default = () => ({
  Component: Track,
  props: { src: trackData }
})

export const WithDetails = () => ({
  Component: Track,
  props: {
    src: trackData,
    details: true
  }
})

export const WithMenu = () => ({
  Component: Track,
  props: {
    src: trackData,
    withMenu: true
  }
})
