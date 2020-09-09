'use strict'

import { BehaviorSubject } from 'rxjs'
import TracksTable from './TracksTable.svelte'
import { disksData } from '../DisksList/DisksList.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'

export default {
  title: 'Components/Tracks table',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
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
    class: 'relative',
    tracks: tracksData,
    current: null
  }
})

export const WithoutAlbum = () => ({
  Component: TracksTable,
  props: {
    class: 'relative',
    tracks: tracksData,
    current: null,
    withAlbum: false
  }
})

export const WithCurrent = () => ({
  Component: TracksTable,
  props: {
    class: 'relative',
    tracks: tracksData,
    current: current$Data
  }
})
