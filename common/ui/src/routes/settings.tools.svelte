<script>
  import { Tool } from '@atelier-wb/svelte'
  import Component from './settings.svelte'
  import { mockWebsocket } from '../atelier/utils'
  import { init, isDesktop } from '../stores/settings'
  import { initConnection } from '../utils/connection'

  const settings = {
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
  // used during tool shot
  initConnection.mockResolvedValue?.(settings)
</script>

<Tool
  name="Views/Settings"
  component={Component}
  setup={async () => {
    await mockWebsocket(
      invoked =>
        invoked === 'settings.get'
          ? settings
          : { melodie: '2.0.0', electron: '11.0.0' },
      settings,
      false
    )()
    isDesktop.next(true)
    window.WINDICSS_VERSION = '3.2.1'
    window.RXJS_VERSION = '6.0.0'
    await init('http://192.168.0.10:9999', '12345678')
  }}
/>
