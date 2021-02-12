'use strict'

import Component from './settings.svelte'
import { websocketResponse, runCustom } from '../../.storybook/loaders'
import { init, isDesktop } from '../stores/settings'

const title = 'Views/Settings'
export default {
  title,
  loaders: [
    websocketResponse(title, invoked =>
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
        : { melodie: '2.0.0', electron: '11.0.0' }
    ),
    runCustom(title, async () => {
      isDesktop.next(true)
      global.TAILWINDCSS_VERSION = '1.9.0'
      global.RXJS_VERSION = '6.0.0'
      await init('http://192.168.0.10:9999')
    })
  ],
  parameters: {
    layout: 'none'
  }
}

export const Default = () => ({ Component })
