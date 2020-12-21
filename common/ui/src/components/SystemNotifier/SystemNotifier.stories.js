'use strict'

import SystemNotifier from './SystemNotifier.stories.svelte'
import { trackListData } from '../Player/Player.stories'
import { add, clear } from '../../stores/track-queue'

export default {
  title: 'Components/System Notifier',
  excludeStories: /.*Data$/,
  parameters: { layout: 'padded' }
}

export const Default = () => {
  clear()
  add(trackListData)
  return {
    Component: SystemNotifier
  }
}
