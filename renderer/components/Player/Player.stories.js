'use strict'

import Player from './Player.svelte'
import trackList from '../../stores/track-list'

export default {
  title: 'Components/Player',
  excludeStories: /.*Data$/
}

export const trackListData = [
  {
    tags: { title: 'file 1', artists: ['Someone'] },
    media: './# Films/cover.jpg',
    path: './file.flac'
  },
  {
    tags: { title: 'file 2', artists: ['Someone else'] },
    media: './cover.jpg',
    path: './file.mp3'
  },
  {
    tags: { title: 'file 3', artists: ['Another fellow'] },
    media: './cover.jpg',
    path: './file.ogg'
  }
]

export const Empty = () => {
  trackList.clear()
  return {
    Component: Player,
    props: { trackList }
  }
}

export const WithTrackList = () => {
  trackList.clear()
  trackList.add(trackListData)
  return {
    Component: Player,
    props: { trackList }
  }
}
