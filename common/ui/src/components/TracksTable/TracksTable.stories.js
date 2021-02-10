'use strict'

import { BehaviorSubject } from 'rxjs'
import TracksTable from './TracksTable.svelte'
import { disksData } from '../DisksList/DisksList.stories'
import { playlistsData } from '../AddToPlaylist/AddToPlaylist.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { websocketResponse } from '../../../.storybook/loaders'

const title = 'Components/Tracks table'

export default {
  title,
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator],
  loaders: [
    websocketResponse(title, () => ({
      total: playlistsData.length,
      size: playlistsData.length,
      from: 0,
      results: playlistsData
    }))
  ],
  parameters: { layout: 'none' }
}

export const tracksData = disksData.map((track, i) => ({
  ...track,
  tags: {
    ...track.tags,
    track: { no: i + 1 }
  }
}))

export const current$Data = new BehaviorSubject(tracksData[3])

export const Default = () => ({
  Component: TracksTable,
  props: {
    tracks: tracksData,
    current: null
  }
})

export const WithoutAlbum = () => ({
  Component: TracksTable,
  props: {
    tracks: tracksData,
    current: null,
    withAlbum: false
  }
})

export const WithCurrent = () => ({
  Component: TracksTable,
  props: {
    tracks: tracksData,
    current: current$Data
  }
})
