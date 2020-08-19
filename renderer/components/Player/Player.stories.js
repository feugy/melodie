'use strict'

import Player from './Player.svelte'
import * as queue from '../../stores/track-queue'

export default {
  title: 'Components/Player',
  excludeStories: /.*Data$/
}

const album = 'An album'
const artists = ['Someone', 'Someone else', 'Another fellow']
const albumRef = [1, album]
const artistRefs = artists.map((artist, id) => [id, artist])

export const trackListData = [
  {
    id: 1,
    tags: { title: 'file 1', album, artists: artists[0], duration: 218.42 },
    media: './# Films/cover.jpg',
    path: './no-duration.mp3',
    albumRef,
    artistRefs: artistRefs.slice(0, 1)
  },
  {
    id: 2,
    tags: { title: 'file 2', album, artists: artists[0], duration: 3.742 },
    media: './# Films/cover.jpg',
    path: './file.flac',
    albumRef,
    artistRefs: artistRefs.slice(0, 1)
  },
  {
    id: 3,
    tags: { title: 'file 3', album, artists: artists[1], duration: 1.74 },
    media: './cover.jpg',
    path: './file.mp3',
    albumRef,
    artistRefs: artistRefs.slice(1, 2)
  },
  {
    id: 4,
    tags: { title: 'file 4', album, artists: artists[2], duration: 2.95 },
    media: './cover.jpg',
    path: './file.ogg',
    albumRef,
    artistRefs: artistRefs.slice(2)
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
