'use strict'

import Player from './Player.svelte'
import * as queue from '../../stores/track-queue'

export default {
  title: 'Components/Player',
  excludeStories: /.*Data$/
}

export const trackListData = [
  {
    id: 1,
    tags: { title: 'file 1', artists: ['Someone'], duration: 218.42 },
    media: './# Films/cover.jpg',
    path: './no-duration.mp3'
  },
  {
    id: 2,
    tags: { title: 'file 2', artists: ['Someone'], duration: 3.742 },
    media: './# Films/cover.jpg',
    path: './file.flac'
  },
  {
    id: 3,
    tags: { title: 'file 3', artists: ['Someone else'], duration: 1.74 },
    media: './cover.jpg',
    path: './file.mp3'
  },
  {
    id: 4,
    tags: { title: 'file 4', artists: ['Another fellow'], duration: 2.95 },
    media: './cover.jpg',
    path: './file.ogg'
  }
]

export const Empty = () => {
  queue.clear()
  return {
    Component: Player
  }
}

export const WithTrackList = () => {
  queue.clear()
  queue.add(trackListData)
  return {
    Component: Player
  }
}
