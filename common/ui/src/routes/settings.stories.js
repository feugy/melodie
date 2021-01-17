'use strict'

import Component from './settings.svelte'
import { websocketResponse } from '../../.storybook/loaders'
import { init } from '../stores/settings'

export default {
  title: 'Views/Settings',
  loaders: [
    () => {
      global.TAILWINDCSS_VERSION = '1.9.0'
      global.RXJS_VERSION = '6.0.0'
    },
    websocketResponse(invoked =>
      invoked === 'settings.get'
        ? {
            folders: ['/home/music', '/home/movies'],
            locale: 'en',
            providers: {
              audiodb: { key: '123456' },
              discogs: { token: 'abcdefg' }
            },
            enqueueBehaviour: {
              clearBefore: true,
              onClick: false
            },
            isBroadcasting: true
          }
        : invoked === 'settings.getUIAddress'
        ? 'http://localhost:10000'
        : { melodie: '2.0.0', electron: '11.0.0' }
    ),
    init
  ],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({ Component })
