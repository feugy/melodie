'use strict'

import { writable } from 'svelte/store'
import ExpandableList, {
  ARTISTS,
  ALBUMS,
  TRACKS
} from './ExpandableList.svelte'
import { artistData } from '../Artist/Artist.stories'
import { albumData } from '../Album/Album.stories'
import { trackData } from '../Track/Track.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'

export default {
  title: 'Components/Expandable list',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator, ipcRendererMock()]
}

export const Artists = () => ({
  Component: ExpandableList,
  props: {
    kind: ARTISTS,
    items: writable(
      Array.from({ length: 5 }, (_, id) => ({ ...artistData, id }))
    )
  }
})

export const Albums = () => ({
  Component: ExpandableList,
  props: {
    kind: ALBUMS,
    items: writable(
      Array.from({ length: 5 }, (_, id) => ({ ...albumData, id }))
    )
  }
})

export const Tracks = () => ({
  Component: ExpandableList,
  props: {
    kind: TRACKS,
    items: writable(
      Array.from({ length: 5 }, (_, id) => ({ ...trackData, id }))
    )
  }
})
