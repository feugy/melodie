'use strict'

import MediaSelector from './MediaSelector.stories.svelte'
import { actionsData } from '../Dialogue/Dialogue.stories'
import { artistData } from '../Artist/Artist.stories'
import { websocketResponse } from '../../../.storybook/loaders'
import { isDesktop } from '../../stores/settings'

export default {
  title: 'Components/Media Selector',
  excludeStories: /.*Data$/,
  argTypes: {
    isDesktop: { control: { type: 'boolean' }, defaultValue: true }
  },
  loaders: [
    websocketResponse(invoked => {
      if (invoked === 'media.findForArtist') {
        return artistSuggestionsData
      } else if (invoked === 'media.findForAlbum') {
        return albumSuggestionsData
      }
    })
  ]
}

export const artistSuggestionsData = [
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/thumb/vuvqxr1352453964.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/tvpvrv1340621795.jpg',
    provider: 'AudioDB'
  },
  {
    artwork:
      'https://www.theaudiodb.com/images/media/artist/fanart/vtvsww1340621807.jpg',
    provider: 'Discogs'
  }
]

export const albumSuggestionsData = artistSuggestionsData.map(
  ({ artwork, provider }) => ({ cover: artwork, provider })
)

export const Default = args => {
  isDesktop.next(args.isDesktop)
  return {
    Component: MediaSelector,
    props: { src: artistData },
    on: actionsData
  }
}

export const ForAlbum = args => {
  isDesktop.next(args.isDesktop)
  return {
    Component: MediaSelector,
    props: { src: artistData, forArtist: false },
    on: actionsData
  }
}
