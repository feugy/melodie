'use strict'

import Nav from './Nav.stories.svelte'
import { isDesktop, init } from '../../stores/settings'
import {
  websocketResponse,
  disconnectWebsocket,
  runCustom
} from '../../../.storybook/loaders'

const settings = {
  providers: { audiodb: {}, discogs: {} },
  enqueueBehaviour: {},
  isBroadcasting: false
}

const title = 'Components/Nav'

const url = `http://192.168.0.10:${Math.floor(Math.random() * 10000)}`

export default {
  title,
  loaders: [
    websocketResponse(
      title,
      invoked => {
        console.log('coucou', invoked)
        if (invoked === 'settings.toggleBroadcast') {
          settings.isBroadcasting = !settings.isBroadcasting
          return settings
        } else if (invoked === 'settings.getUIAddress') {
          return url
        } else {
          return settings
        }
      },
      false
    ),
    runCustom(title, () => init(url, () => {}))
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
