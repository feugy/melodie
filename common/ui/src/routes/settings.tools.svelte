<script>
  import { Tool } from '@atelier-wb/svelte'
  import Component from './settings.svelte'
  import { mockWebsocket } from '../atelier/utils'
  import { init, isDesktop } from '../stores/settings'
</script>

<Tool
  name="Views/Settings"
  component={Component}
  setup={async () => {
    await mockWebsocket(
      invoked =>
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
          : { melodie: '2.0.0', electron: '11.0.0' },
      false
    )()
    isDesktop.next(true)
    window.TAILWINDCSS_VERSION = '1.9.0'
    window.RXJS_VERSION = '6.0.0'
    await init('http://192.168.0.10:9999')
  }}
/>
