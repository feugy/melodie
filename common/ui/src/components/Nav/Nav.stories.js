'use strict'

import Nav from './Nav.stories.svelte'
import { isDesktop, init } from '../../stores/settings'
import {
  websocketResponse,
  disconnectWebsocket
} from '../../../.storybook/loaders'

const settings = {
  providers: { audiodb: {}, discogs: {} },
  enqueueBehaviour: {},
  isBroadcasting: false
}

const title = 'Components/Nav'

export default {
  title,
  loaders: [
    websocketResponse(
      title,
      invoked => {
        if (invoked === 'settings.toggleBroadcast') {
          settings.isBroadcasting = !settings.isBroadcasting
          return settings
        } else if (invoked === 'settings.getUIAddress') {
          return `http://192.168.0.10:${Math.floor(Math.random() * 10000)}`
        } else {
          return settings
        }
      },
      false
    ),
    () => init('unused', () => {})
  ],
  argTypes: {
    isDesktop: { control: { type: 'boolean' }, defaultValue: true },
    isConnected: { control: { type: 'boolean' }, defaultValue: true }
  },
  parameters: { layout: 'none' }
}

export const Default = args => {
  isDesktop.next(args.isDesktop)
  if (!args.isConnected) {
    disconnectWebsocket()
  }
  return { Component: Nav }
}
