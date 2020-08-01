'use strict'

import TracksQueue from './TracksQueue.svelte'
import * as queue from '../../stores/track-queue'
import { trackListData } from '../Player/Player.stories'

export default {
  title: 'Components/Tracks queue',
  excludeStories: /.*Data$/
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
  return {
    Component: TracksQueue
  }
}
