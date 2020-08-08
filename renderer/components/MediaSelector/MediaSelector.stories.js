'use strict'

import { action } from '@storybook/addon-actions'
import MediaSelector from './MediaSelector.stories.svelte'
import { actionsData } from '../Dialogue/Dialogue.stories'
import { artistData } from '../Artist/Artist.stories'
import { translate } from '../../tests/utils'

const invokeAction = action('invoke')

export default {
  title: 'Components/Media Selector',
  excludeStories: /.*Data$/,
  decorators: [
    storyFn => {
      window.electron.ipcRenderer = {
        invoke: (channel, service, method, ...args) => {
          invokeAction(service, method, ...args)
          if (method === 'findForArtist') {
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
    preview:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg/preview',
    full:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg'
  },
  {
    preview:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg/preview',
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg'
  },
  {
    preview:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg/preview',
    full:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg'
  }
]

export const Default = () => ({
  Component: MediaSelector,
  props: {
    title: translate('choose avatar'),
    src: artistData
  },
  on: actionsData
})
