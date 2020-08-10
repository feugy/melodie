'use strict'

import { action } from '@storybook/addon-actions'
import MediaSelector from './MediaSelector.stories.svelte'
import { actionsData } from '../Dialogue/Dialogue.stories'
import { artistData } from '../Artist/Artist.stories'

const invokeAction = action('invoke')

export default {
  title: 'Components/Media Selector',
  excludeStories: /.*Data$/,
  decorators: [
    storyFn => {
      window.electron.ipcRenderer = {
        invoke: (channel, service, method, ...args) => {
          invokeAction(service, method, ...args)
          if (method === 'findForArtist' || method === 'findForAlbum') {
            return suggestionsData
          }
        }
      }
      return storyFn()
    }
  ]
}

export const suggestionsData = [
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  }
]

export const Default = () => ({
  Component: MediaSelector,
  props: {
    src: artistData
  },
  on: actionsData
})

export const ForAlbum = () => ({
  Component: MediaSelector,
  props: {
    forArtist: false,
    src: artistData
  },
  on: actionsData
})
