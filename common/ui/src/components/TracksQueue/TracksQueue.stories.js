'use strict'

import TracksQueue from './TracksQueue.svelte'
import * as queue from '../../stores/track-queue'
import { trackListData } from '../Player/Player.stories'
import {
  hrefSinkDecorator,
  ipcRendererMock
} from '../../../.storybook/decorators'

export default {
  title: 'Components/Tracks queue',
  excludeStories: /.*Data$/,
  decorators: [
    hrefSinkDecorator,
    ipcRendererMock(() => ({ results: [], total: 0 }))
  ]
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
