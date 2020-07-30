'use strict'

import { action } from '@storybook/addon-actions'
import { BehaviorSubject } from 'rxjs'
import TracksTable from './TracksTable.svelte'

export default {
  title: 'Components/Tracks table',
  excludeStories: /.*Data$/
}

export const tracksData = [
  {
    id: 1,
    tags: {
      title: 'American Money',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 2,
    tags: {
      title: 'Fantaisie Sign',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 3,
    tags: {
      title: "Don't Bother None",
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 4,
    tags: {
      title: 'Vitamin A',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 5,
    tags: {
      title: 'LIVE in Baghdad',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 6,
    tags: {
      title: 'Cats on Mars',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 7,
    tags: {
      title: 'Want it All Back',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 8,
    tags: {
      title: 'Bindy',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 9,
    tags: {
      title: 'You Make Me Coo',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 10,
    tags: {
      title: 'Vitamin B',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 11,
    tags: {
      title: 'Green Bird',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 12,
    tags: {
      title: 'ELM',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 13,
    tags: {
      title: 'Vitamin C',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 14,
    tags: {
      title: 'Gateway',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 15,
    tags: {
      title: 'The Singing Sea',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 16,
    tags: {
      title: 'The Egg and You!',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 17,
    tags: {
      title: 'Forever Broke',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
    }
  },
  {
    id: 18,
    tags: {
      title: 'Power of Kungfu Remix',
      artists: ['Yoko Kanno and the Seatbelts'],
      album: 'Cowboy Bebop - NoDisc'
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
    tracks: tracksData
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
