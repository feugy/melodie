'use strict'

import PlaylistTracksTable from './PlaylistTracksTable.svelte'
import { disksData } from '../DisksList/DisksList.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Playlist tracks table',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const playlistData = {
  id: 1,
  name: 'My favourites',
  refs: [
    [1, 'Ben Harper'],
    [2, 'The Innocent Criminals'],
    [1, 'Diamonds on the inside']
  ],
  media: null,
  tracks: disksData.map((track, i) => ({
    ...track,
    tags: {
      ...track.tags,
      track: { no: i + 1 }
    }
  }))
}
playlistData.trackIds = playlistData.tracks.map(({ id }) => id)

export const Default = () => ({
  Component: PlaylistTracksTable,
  props: {
    playlist: playlistData
  }
})
