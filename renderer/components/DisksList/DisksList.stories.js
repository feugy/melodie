'use strict'

import DisksList from './DisksList.svelte'
import { current$Data } from '../TracksTable/TracksTable.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'

export default {
  title: 'Components/Disks list',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator, ipcRendererMock()]
}

const album = 'Cowboy Bebop - NoDisc'
const artists = ['Yoko Kanno and the Seatbelts']
const albumRef = [1, album]
const artistRefs = artists.map((artist, id) => [id, artist])

export const disksData = [
  {
    id: 1,
    tags: {
      title: 'American Money',
      artists,
      album,
      duration: 332,
      track: { no: 1 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 2,
    tags: {
      title: 'Fantaisie Sign',
      artists,
      album,
      duration: 215,
      track: { no: 2 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 3,
    tags: {
      title: "Don't Bother None",
      artists,
      album,
      duration: 225,
      disk: { no: 1 },
      track: { no: 3 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 4,
    tags: {
      title: 'Vitamin A',
      artists,
      album,
      duration: 281,
      disk: { no: 1 },
      track: { no: 2 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 5,
    tags: {
      title: 'LIVE in Baghdad',
      artists,
      album,
      duration: 179,
      disk: { no: 2 },
      track: { no: 3 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 6,
    tags: {
      title: 'Cats on Mars',
      artists,
      album,
      duration: 7,
      disk: { no: 2 },
      track: { no: 2 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 7,
    tags: {
      title: 'Want it All Back',
      artists,
      album,
      duration: 231,
      disk: { no: 1 },
      track: { no: 4 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 8,
    tags: {
      title: 'Bindy',
      artists,
      album,
      duration: 15,
      disk: { no: 1 },
      track: { no: 5 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 9,
    tags: {
      title: 'You Make Me Coo',
      artists,
      album,
      duration: 194,
      disk: { no: 1 },
      track: { no: 6 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 10,
    tags: {
      title: 'Vitamin B',
      artists,
      album,
      duration: 246,
      disk: { no: 2 },
      track: { no: 4 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 11,
    tags: {
      title: 'Green Bird',
      artists,
      album,
      duration: 153,
      disk: { no: 2 },
      track: { no: 5 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 12,
    tags: {
      title: 'ELM',
      artists,
      album,
      duration: 415,
      disk: { no: 2 },
      track: { no: 6 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 13,
    tags: {
      title: 'Vitamin C',
      artists,
      album,
      duration: 324,
      disk: { no: 1 },
      track: { no: 7 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 14,
    tags: {
      title: 'Gateway',
      artists,
      album,
      duration: 16,
      disk: { no: 1 },
      track: { no: 8 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 15,
    tags: {
      title: 'The Singing Sea',
      artists,
      album,
      duration: 401,
      disk: { no: 2 },
      track: { no: 7 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 16,
    tags: {
      title: 'The Egg and You!',
      artists,
      album,
      duration: 287,
      disk: { no: 2 },
      track: { no: 8 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 17,
    tags: {
      title: 'Forever Broke',
      artists,
      album,
      duration: 96,
      disk: { no: 1 },
      track: { no: 9 }
    },
    albumRef,
    artistRefs
  },
  {
    id: 18,
    tags: {
      title: 'Power of Kungfu Remix',
      artists,
      album,
      duration: 142,
      disk: { no: 2 },
      track: { no: 9 }
    },
    albumRef,
    artistRefs
  }
]

export const Default = () => ({
  Component: DisksList,
  props: {
    tracks: disksData,
    current: current$Data
  }
})
