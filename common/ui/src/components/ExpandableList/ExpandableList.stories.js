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
import { playlistsData } from '../AddToPlaylist/AddToPlaylist.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { websocketResponse } from '../../../.storybook/loaders'

export default {
  title: 'Components/Expandable list',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator],
  parameters: { layout: 'padded' }
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
Artists.loaders = [websocketResponse(() => artistData)]

export const Albums = () => ({
  Component: ExpandableList,
  props: {
    kind: ALBUMS,
    items: writable(
      Array.from({ length: 5 }, (_, id) => ({ ...albumData, id }))
    )
  }
})
Albums.loaders = [websocketResponse(() => albumData)]

export const Tracks = () => ({
  Component: ExpandableList,
  props: {
    kind: TRACKS,
    items: writable(
      Array.from({ length: 5 }, (_, id) => ({ ...trackData, id }))
    )
  }
})
Tracks.loaders = [
  websocketResponse(() => ({
    total: playlistsData.length,
    size: playlistsData.length,
    from: 0,
    results: playlistsData
  }))
]
