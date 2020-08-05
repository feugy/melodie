'use strict'

import { action } from '@storybook/addon-actions'
import { BehaviorSubject } from 'rxjs'
import TracksTable from './TracksTable.svelte'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Tracks table',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const tracksData = [
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
      track: { no: 5 }
    }
  },
  {
    id: 4,
    tags: {
      title: 'Vitamin A',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 281,
      track: { no: 4 }
    }
  },
  {
    id: 5,
    tags: {
      title: 'LIVE in Baghdad',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 179,
      track: { no: 3 }
    }
  },
  {
    id: 6,
    tags: {
      title: 'Cats on Mars',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 7
    }
  },
  {
    id: 7,
    tags: {
      title: 'Want it All Back',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 231,
      track: { no: 7 }
    }
  },
  {
    id: 8,
    tags: {
      title: 'Bindy',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 15,
      track: { no: 9 }
    }
  },
  {
    id: 9,
    tags: {
      title: 'You Make Me Coo',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 194,
      track: { no: 10 }
    }
  },
  {
    id: 10,
    tags: {
      title: 'Vitamin B',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 246,
      track: { no: 11 }
    }
  },
  {
    id: 11,
    tags: {
      title: 'Green Bird',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 153,
      track: { no: 12 }
    }
  },
  {
    id: 12,
    tags: {
      title: 'ELM',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 415
    }
  },
  {
    id: 13,
    tags: {
      title: 'Vitamin C',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 324,
      track: { no: 13 }
    }
  },
  {
    id: 14,
    tags: {
      title: 'Gateway',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 16,
      track: { no: 14 }
    }
  },
  {
    id: 15,
    tags: {
      title: 'The Singing Sea',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 401,
      track: { no: 15 }
    }
  },
  {
    id: 16,
    tags: {
      title: 'The Egg and You!',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 287,
      track: { no: 17 }
    }
  },
  {
    id: 17,
    tags: {
      title: 'Forever Broke',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 96,
      track: { no: 18 }
    }
  },
  {
    id: 18,
    tags: {
      title: 'Power of Kungfu Remix',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc',
      duration: 142,
      track: { no: 19 }
    }
  }
]

export const current$Data = new BehaviorSubject(tracksData[3])

export const actionsData = {
  enqueue: action('on track enqueue'),
  play: action('on track play')
}

export const Default = () => ({
  Component: TracksTable,
  props: {
    tracks: tracksData,
    current: null
  },
  on: actionsData
})

export const WithoutAlbum = () => ({
  Component: TracksTable,
  props: {
    tracks: tracksData,
    current: null,
    withAlbum: false
  },
  on: actionsData
})

export const WithCurrent = () => ({
  Component: TracksTable,
  props: {
    tracks: tracksData,
    current: current$Data
  },
  on: actionsData
})
