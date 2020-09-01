'use strict'

import TracksList from './TracksList.svelte'
import { trackListData } from '../Player/Player.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { action } from '@storybook/addon-actions'

export default {
  title: 'Components/Tracks list',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator]
}

export const actionsData = {
  click: action('on track clicked'),
  move: action('on track moved'),
  remove: action('on track removed')
}

export const Empty = () => ({
  Component: TracksList,
  props: {
    tracks: []
  },
  on: actionsData
})

export const WithTrackList = () => ({
  Component: TracksList,
  props: {
    tracks: [...trackListData, ...trackListData],
    index: 4
  },
  on: actionsData
})
