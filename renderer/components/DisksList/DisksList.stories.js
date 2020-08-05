'use strict'

import DisksList from './DisksList.svelte'
import { actionsData, current$Data } from '../TracksTable/TracksTable.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Disks list',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const disksData = [
  {
    id: 1,
    tags: {
      title: 'American Money',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 332,
      track: { no: 1 }
    }
  },
  {
    id: 2,
    tags: {
      title: 'Fantaisie Sign',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 215,
      track: { no: 2 }
    }
  },
  {
    id: 3,
    tags: {
      title: "Don't Bother None",
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 225,
      disk: { no: 1 },
      track: { no: 3 }
    }
  },
  {
    id: 4,
    tags: {
      title: 'Vitamin A',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 281,
      disk: { no: 1 },
      track: { no: 2 }
    }
  },
  {
    id: 5,
    tags: {
      title: 'LIVE in Baghdad',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 179,
      disk: { no: 2 },
      track: { no: 3 }
    }
  },
  {
    id: 6,
    tags: {
      title: 'Cats on Mars',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 7,
      disk: { no: 2 },
      track: { no: 2 }
    }
  },
  {
    id: 7,
    tags: {
      title: 'Want it All Back',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 231,
      disk: { no: 1 },
      track: { no: 4 }
    }
  },
  {
    id: 8,
    tags: {
      title: 'Bindy',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 15,
      disk: { no: 1 },
      track: { no: 5 }
    }
  },
  {
    id: 9,
    tags: {
      title: 'You Make Me Coo',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 194,
      disk: { no: 1 },
      track: { no: 6 }
    }
  },
  {
    id: 10,
    tags: {
      title: 'Vitamin B',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 246,
      disk: { no: 2 },
      track: { no: 4 }
    }
  },
  {
    id: 11,
    tags: {
      title: 'Green Bird',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 153,
      disk: { no: 2 },
      track: { no: 5 }
    }
  },
  {
    id: 12,
    tags: {
      title: 'ELM',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 415,
      disk: { no: 2 },
      track: { no: 6 }
    }
  },
  {
    id: 13,
    tags: {
      title: 'Vitamin C',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 324,
      disk: { no: 1 },
      track: { no: 7 }
    }
  },
  {
    id: 14,
    tags: {
      title: 'Gateway',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 16,
      disk: { no: 1 },
      track: { no: 8 }
    }
  },
  {
    id: 15,
    tags: {
      title: 'The Singing Sea',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 401,
      disk: { no: 2 },
      track: { no: 7 }
    }
  },
  {
    id: 16,
    tags: {
      title: 'The Egg and You!',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 287,
      disk: { no: 2 },
      track: { no: 8 }
    }
  },
  {
    id: 17,
    tags: {
      title: 'Forever Broke',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 96,
      disk: { no: 1 },
      track: { no: 9 }
    }
  },
  {
    id: 18,
    tags: {
      title: 'Power of Kungfu Remix',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 142,
      disk: { no: 2 },
      track: { no: 9 }
    }
  }
]

export const Default = () => ({
  Component: DisksList,
  props: {
    tracks: disksData,
    current: current$Data
  },
  on: actionsData
})
