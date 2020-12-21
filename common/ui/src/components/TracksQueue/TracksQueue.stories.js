'use strict'

import TracksQueue from './TracksQueue.svelte'
import * as queue from '../../stores/track-queue'
import { trackListData } from '../Player/Player.stories'
import { hrefSinkDecorator } from '../../../.storybook/decorators'
import { websocketResponse } from '../../../.storybook/loaders'

export default {
  title: 'Components/Tracks queue',
  excludeStories: /.*Data$/,
  decorators: [hrefSinkDecorator],
  loaders: [websocketResponse(() => ({ results: [], total: 0 }))],
  parameters: { layout: null }
}

export const Empty = () => {
  queue.clear()
  return {
    Component: TracksQueue
  }
}

export const WithTrackList = () => {
  queue.clear()
  queue.add(trackListData)
  queue.add(trackListData)
  return {
    Component: TracksQueue
  }
}
